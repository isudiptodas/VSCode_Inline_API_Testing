
# Inline API Testing
Test your APIs on one click without leaving your active file window.

## Usage steps: 
1. Install extension
2. Write any API calling function 
3. A popup will be visible as `Test API` upon that API line
4. Click on `Test API`
5. The API response will be saved in a new `api_response.json` file

## Features:
1. Inline API detection (ts, js, tsx, jsx)
2. One click API testing
3. API response saving mechanism in **json**

## Supported request format:
- URL with query parameters  
- JSON request body  
- Headers object  
- axios config style requests  
- fetch request body

## Limitations:
- Cannot execute dynamic JavaScript logic  
- Cannot resolve runtime variables  
- Cannot evaluate functions inside API calls  
- Cannot fully interpret computed expressions  
- Limited support for:  
  - getUrl()  
  - process.env inside runtime logic  
  - spread operators (...data)  
  - Limited deep object parsing (complex nested structures may fail)
 
## Example usage

### Axios
```javascript
axios.post("https://api.org/post", {
  name: "test",
  age: 25
});
```

```javascript
axios.get("https://api.example.com", {
  headers: {
    Authorization: "Bearer token123",
    "Content-Type": "application/json"
  }
});
```

```javascript
axios.get("https://api.com/users?id=1&type=admin");
```

### Fetch
```javascript
fetch("https://api.org/post", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "test",
    age: 25
  })
});
```
```javascript
fetch("https://api.example.com", {
  method: "GET",
  headers: {
    Authorization: "Bearer token123",
    "Content-Type": "application/json"
  }
});
```
```javascript
fetch("https://api.com/users?id=1&type=admin", {
  method: "GET"
});
```


