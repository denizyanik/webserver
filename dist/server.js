"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
class BasicWebServer {
    constructor() {
        this.server = http.createServer();
    }
    // logs low-level socket information
    logSocketInfo(socket) {
        console.log('Socket Information:');
        console.log(`Remote Address: ${socket.remoteAddress}`);
        console.log(`Remote Port: ${socket.remotePort}`);
        console.log(`Local Address: ${socket.localAddress}`);
        console.log(`Local Port: ${socket.localPort}`);
    }
    //start the server 
    listen(port) {
        this.server.listen(port, () => {
            console.log(`server running on port ${port}`);
        });
        // attach socket event listeners to listen to new client connections
        // can be used to execute custom logic specific to each connection i.e closing the connections for blacklisted ips
        this.server.on('connection', (socket) => {
            this.logSocketInfo(socket);
            socket.on('error', (err) => {
                console.error('Socket error:', err);
            });
        });
        return this;
    }
}
const server = new BasicWebServer().listen(3000);
