import * as vscode from "vscode";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

let requestCount = 0;

// activate
export function activate(context: vscode.ExtensionContext) {

    const codeLensProvider = vscode.languages.registerCodeLensProvider(
        [
            { language: "javascript" },
            { language: "typescript" },
            { language: "javascriptreact" },
            { language: "typescriptreact" }
        ],
        new ApiCodeLensProvider()
    );

    const runCommand = vscode.commands.registerCommand(
        "inlineApiTester.testApi",
        async (lineText: string) => {

            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const code = editor.document.getText();

            const apis = extractApis(code);

            if (!apis.length) {
                vscode.window.showErrorMessage("No API found");
                return;
            }

            for (const api of apis) {
                const result = await executeApi(api);
                saveResponse(result, editor.document.uri.fsPath);
            }

            vscode.window.showInformationMessage("API test completed");
        }
    );

    context.subscriptions.push(codeLensProvider, runCommand);
}

// CodeLens UI
class ApiCodeLensProvider implements vscode.CodeLensProvider {

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {

        const lenses: vscode.CodeLens[] = [];

        for (let i = 0; i < document.lineCount; i++) {

            const line = document.lineAt(i).text;

            if (line.includes("fetch(") || line.includes("axios.")) {

                const range = new vscode.Range(i, 0, i, line.length);

                lenses.push(new vscode.CodeLens(range, {
                    title: "▶ Test API",
                    command: "inlineApiTester.testApi"
                }));
            }
        }

        return lenses;
    }
}

// extract APIs using AST
function extractApis(code: string) {

    const ast = parse(code, {
        sourceType: "unambiguous",
        plugins: ["typescript", "jsx"]
    });

    const apis: any[] = [];

    traverse(ast, {

        CallExpression(path) {

            const node = path.node;

            // fetch
            if (node.callee.type === "Identifier" && node.callee.name === "fetch") {

                apis.push({
                    type: "fetch",
                    method: "GET",
                    urlNode: node.arguments?.[0],
                    headersNode: node.arguments?.[1],
                    bodyNode: node.arguments?.[1]
                });
            }

            // axios
            if (node.callee.type === "MemberExpression") {

                const obj = (node.callee.object as any)?.name;
                const method = (node.callee.property as any)?.name;

                if (obj === "axios") {

                    apis.push({
                        type: "axios",
                        method: method?.toUpperCase() || "GET",
                        urlNode: node.arguments?.[0],
                        dataNode: node.arguments?.[1],
                        headersNode: node.arguments?.[2]
                    });
                }
            }
        }
    });

    return apis;
}

// execute API request
async function executeApi(api: any) {

    try {

        const url = resolveNode(api.urlNode);

        if (!url || !url.startsWith("http")) {
            throw new Error("Invalid URL");
        }

        let headers: any = {};
        let body: any = undefined;

        // headers
        if (api.headersNode) {
            try {
                headers = resolveNode(api.headersNode);
                headers = typeof headers === "string" ? JSON.parse(headers) : headers;
            } catch {
                headers = {};
            }
        }

        // body / data
        if (api.dataNode || api.bodyNode) {
            try {
                const rawBody = resolveNode(api.dataNode || api.bodyNode);

                body = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;

            } catch {
                body = undefined;
            }
        }

        const response = await axios({
            method: api.method,
            url,
            headers,
            data: body
        });

        return {
            success: true,
            status: response.status,
            data: response.data
        };

    } catch (err: any) {

        return {
            success: false,
            error: err.message,
            data: err.response?.data || null
        };
    }
}

// resolve AST node to usable value
function resolveNode(node: any): any {

    if (!node) return undefined;

    // string
    if (node.type === "StringLiteral") {
        return node.value;
    }

    // template string
    if (node.type === "TemplateLiteral") {
        return node.quasis.map((q: any) => q.value.cooked).join("");
    }

    // object literal (IMPORTANT FIX FOR BODY)
    if (node.type === "ObjectExpression") {

        const obj: any = {};

        node.properties.forEach((prop: any) => {

            const key = prop.key.name || prop.key.value;
            const value = prop.value;

            if (value.type === "StringLiteral") {
                obj[key] = value.value;
            }

            else if (value.type === "NumericLiteral") {
                obj[key] = value.value;
            }

            else if (value.type === "BooleanLiteral") {
                obj[key] = value.value;
            }

            else {
                obj[key] = undefined;
            }
        });

        return obj;
    }

    return undefined;
}

// save response to file
function saveResponse(result: any, filePath: string) {

    const dir = path.dirname(filePath);

    requestCount++;

    const fileName =
        requestCount === 1
            ? "api_response.json"
            : `api_response_${requestCount}.json`;

    const fullPath = path.join(dir, fileName);

    fs.writeFileSync(fullPath, JSON.stringify(result, null, 2));
}

export function deactivate() {}