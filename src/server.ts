import * as net from "net";

interface HttpRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
}

interface HttpResponse {
  statusCode: number;
  contentType: string;
  body: string;
}

class BasicWebServer {
  private server: net.Server;

  constructor() {
    this.server = net.createServer();
  }

  public listen(port: number) {
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

  private parseRequest(request: string): HttpRequest {
    const [headerPart, bodyPart] = request.split("\r\n\r\n");
    const headerLines = headerPart.split("\r\n");
    const [method, path] = headerLines[0].split(" ");

    const headers: Record<string, string> = {};
    for (let i = 1; i < headerLines.length; i++) {
      const [key, value] = headerLines[i].split(": ");
      headers[key] = value;
    }

    return { method, path, headers, body: bodyPart || "" };
  }

  private handleRequest(socket: net.Socket, request: HttpRequest) {
    let response: HttpResponse;
    // calls relevant function based on the HTTP request method
    switch (request.method) {
      case "GET":
        response = this.handleGetRequest(request);
        break;
      case "POST":
        response = this.handlePostRequest(request);
        break;
      default:
        response = { statusCode: 405, contentType: "text/plain", body: "Method Not Allowed" };
        break;
    }

    this.sendResponse(socket, response);
  }

  private handleGetRequest(request: HttpRequest): HttpResponse {
    let body;
    let statusCode;

    switch (request.path) {
      case "/":
        body = "Welcome to the home page!";
        statusCode = 200;
        break;
      case "/about":
        body = "This is the about page!";
        statusCode = 200;
        break;
      default:
        body = "Not Found";
        statusCode = 404;
        break;
    }

    return { body, statusCode, contentType: "text/plain" };
  }

  private handlePostRequest(request: HttpRequest): HttpResponse {
    let body;
    let statusCode;

    switch (request.path) {
      case "/submit":
        const parsedBody = this.parseBody(request.body);
        console.log("Parsed Body:", parsedBody);
        body = `Received your submission: ${JSON.stringify(parsedBody)}`;
        statusCode = 200;
        break;
      default:
        statusCode = 404;
        body = "Path not found";
    }

    return { body, statusCode, contentType: "text/plain" };
  }

  private parseBody(body: string): Record<string, string> {
    const params = new URLSearchParams(body);
    const parsedBody: Record<string, string> = {};
    for (const [key, value] of params) {
      parsedBody[key] = value;
    }
    return parsedBody;
  }

  private sendResponse(socket: net.Socket, response: HttpResponse) {
    const rawResponse =
      `HTTP/1.1 ${response.statusCode} ${response.statusCode === 200 ? "OK" : "Error"}\r\n` +
      `Content-Type: ${response.contentType}\r\n` +
      `Content-Length: ${Buffer.byteLength(response.body)}\r\n\r\n` +
      response.body;

    socket.write(rawResponse);
    socket.end();
  }
}

const server = new BasicWebServer().listen(3000);
