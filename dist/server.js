"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
class BasicWebServer {
    constructor() {
        this.routes = {};
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
                const request = this.parseRequest(data.toString());
                this.handleRequest(socket, request);
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
    // method that allows us to register routes dynamically
    registerRoute(method, path, handler) {
        const upperMethod = method.toUpperCase();
        if (!this.routes[upperMethod]) {
            this.routes[upperMethod] = {};
        }
        this.routes[upperMethod][path] = handler;
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
        const methodRoutes = this.routes[request.method.toUpperCase()];
        if (methodRoutes) {
            const handler = methodRoutes[request.path];
            if (handler) {
                const response = handler(request);
                this.sendResponse(socket, response);
                return;
            }
        }
        this.sendResponse(socket, {
            statusCode: 404,
            contentType: "text/plain",
            body: "Not Found",
        });
    }
    parseBody(body) {
        const params = new URLSearchParams(body);
        const parsedBody = {};
        for (const [key, value] of params) {
            parsedBody[key] = value;
        }
        return parsedBody;
    }
    sendResponse(socket, response) {
        const rawResponse = `HTTP/1.1 ${response.statusCode} ${response.statusCode === 200 ? "OK" : "Error"}\r\n` +
            `Content-Type: ${response.contentType}\r\n` +
            `Content-Length: ${Buffer.byteLength(response.body)}\r\n\r\n` +
            response.body;
        socket.write(rawResponse);
        socket.end();
    }
}
const server = new BasicWebServer();
// Register GET routes
server.registerRoute("GET", "/", () => ({
    statusCode: 200,
    contentType: "text/plain",
    body: "Welcome to the home page!",
}));
server.registerRoute("GET", "/about", () => ({
    statusCode: 200,
    contentType: "text/plain",
    body: "This is the about page!",
}));
server.registerRoute("GET", "/not-found", () => ({
    statusCode: 404,
    contentType: "text/plain",
    body: "Not Found",
}));
// Register POST routes
server.registerRoute("POST", "/submit", (req) => {
    const parsedBody = server.parseBody(req.body);
    console.log("Parsed Body:", parsedBody);
    return {
        statusCode: 200,
        contentType: "text/plain",
        body: `Received your submission: ${JSON.stringify(parsedBody)}`,
    };
});
// Register PUT routes
server.registerRoute("PUT", "/update", (req) => {
    const parsedBody = server.parseBody(req.body);
    console.log("Parsed Body:", parsedBody);
    return {
        statusCode: 200,
        contentType: "text/plain",
        body: `Received your submission: ${JSON.stringify(parsedBody)}`,
    };
});
// Register DELETE routes
server.registerRoute("DELETE", "/delete", () => ({
    statusCode: 200,
    contentType: "text/plain",
    body: "Resource deleted successfully",
}));
// Register PATCH routes
server.registerRoute("PATCH", "/modify", (req) => {
    const parsedBody = server.parseBody(req.body);
    console.log("Parsed Body:", parsedBody);
    return {
        statusCode: 200,
        contentType: "text/plain",
        body: `Received your submission: ${JSON.stringify(parsedBody)}`,
    };
});
server.listen(3000);
