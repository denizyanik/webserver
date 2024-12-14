import * as net from 'net';

class BasicWebServer {
  private server: net.Server;

  constructor() {
    this.server = net.createServer();
  }

  private handleRequest(socket: net.Socket, request: string) {
    // Simple response
    const response = `
        HTTP/1.1 200 OK
        Content-Type: text/plain
        Content-Length: 13

        Hello, world!
        `;
    socket.write(response);
    socket.end();
  }

  public listen(port: number) {
    this.server.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    // attach socket listener to handle new client connections
    this.server.on('connection', (socket) => {
        console.log('New client connected');
      
        // listen for data from the client
        socket.on('data', (data) => {
            console.log('Received data:', data.toString());
            this.handleRequest(socket, data.toString());
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });

        socket.on('end', () => {
            console.log('Client disconnected');
        });
    });

    return this;
  }
}

const server = new BasicWebServer().listen(3000);
