"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
class BasicWebServer {
    constructor() {
        this.server = net.createServer();
    }
    listen(port) {
        this.server.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
        // attach socket listener to handle client connections
        // the socket.on functon executes based on the events received from the client
        this.server.on("connection", (socket) => {
            console.log("New client connected");
            // listen for data from the client
            // the data event gives raw bytes from the client. For a HTTP server, this data is a string that needs to be parsed
            socket.on("data", (data) => {
                console.log("Received data:", data.toString());
                this.handleRequest(socket, data.toString());
            });
            socket.on("error", (err) => {
                console.error("Socket error:", err);
            });
            socket.on("end", () => {
                console.log("Client disconnected");
            });
        });
        return this;
    }
    /* HTTP request examples
  
      POST /users HTTP/1.1
      Host: example.com
      Content-Type: application/x-www-form-urlencoded
      Content-Length: 50
  
      name=FirstName%20LastName&email=bsmth%40example.com
  
      The start-line in HTTP/1.x requests (POST /users HTTP/1.1 in the example above) is called a "request-line" and is made of three parts:
      <method> <request-target> <protocol>
   
      GET /contact HTTP/1.1
      Host: example.com
      User-Agent: curl/8.6.0
  
      after the last header there is a blank line followed by the request body
    */
    parseRequest(request) {
        const [headerPart, bodyPart] = request.split("\r\n\r\n");
        const headerLines = headerPart.split("\r\n");
        const [method, path] = headerLines[0].split(" ");
        const headers = {};
        for (let i = 1; i < headerLines.length; i++) {
            const [key, value] = headerLines[i].split(": ");
            headers[key] = value;
        }
        return { method, path, headers, body: bodyPart || "" };
    }
    handleRequest(socket, request) {
        const parsed = this.parseRequest(request);
        console.log("Parsed Request:", parsed);
        // calls relevant function based on the HTTP request method
        switch (parsed.method) {
            case "GET":
                this.handleGetRequest(socket, parsed.path);
                break;
            case "POST":
                this.handlePostRequest(socket, parsed.path, parsed.body);
                break;
            default:
                this.sendResponse(socket, 405, "Method Not Allowed", "Method not supported");
        }
    }
    handleGetRequest(socket, path) {
        let responseBody = "Not Found";
        let statusCode = 404;
        if (path === "/") {
            responseBody = "Welcome to the home page!";
            statusCode = 200;
        }
        else if (path === "/about") {
            responseBody = "This is the about page!";
            statusCode = 200;
        }
        this.sendResponse(socket, statusCode, "text/plain", responseBody);
    }
    handlePostRequest(socket, path, body) {
        if (path === "/submit") {
            const parsedBody = this.parseBody(body);
            console.log("Parsed Body:", parsedBody);
            const responseBody = `Received your submission: ${JSON.stringify(parsedBody)}`;
            this.sendResponse(socket, 200, "text/plain", responseBody);
        }
        else {
            this.sendResponse(socket, 404, "Not Found", "Path not found");
        }
    }
    parseBody(body) {
        const params = new URLSearchParams(body);
        const parsedBody = {};
        for (const [key, value] of params) {
            parsedBody[key] = value;
        }
        return parsedBody;
    }
    sendResponse(socket, statusCode, contentType, body) {
        const response = `HTTP/1.1 ${statusCode} ${statusCode === 200 ? "OK" : "Error"}\r\n` +
            `Content-Type: ${contentType}\r\n` +
            `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n` +
            body;
        socket.write(response);
        socket.end();
        console.log(response);
    }
}
const server = new BasicWebServer().listen(3000);
