const dockerode = require("dockerode");

const serverAddress = "http://0.0.0.0:8081";
const Docker = new dockerode();

module.exports.Sandbox = class {

    constructor(userId, clientSocket) {

        let createOptions = {
            Env: [
                "SERVER=" + serverAddress,
                "ID=" + userId
            ],
            Hostconfig: {
                NetworkMode: "host"
            }
        };
        Docker.run("test", null, null, createOptions, null);

        this.clientSocket = clientSocket;
        this.sandboxSocket = null;

        this.clientSocket.on("run", function(data) {

            console.log("client send RUN");
            if (this.sandboxSocket) {
                this.sandboxSocket.emit("exec", { sourceCode: data.sourceCode });
            }
    
        }.bind(this));
    
        this.clientSocket.on("input", function(data) {
    
            console.log("client send INPUT");
            if (this.sandboxSocket) {
                this.sandboxSocket.emit("i", { input: data.input });
            }
    
        }.bind(this));

        this.clientSocket.on("stop", function() {

            console.log("client send STOP");
            if (this.sandboxSocket) {
                this.sandboxSocket.emit("stop");
            }
        }.bind(this))

    }

    connect(sandboxSocket) {
        this.sandboxSocket = sandboxSocket;
        
        this.sandboxSocket.on("start", function() {

            console.log("start...");
            this.clientSocket.emit("start");

        }.bind(this));

        this.sandboxSocket.on("o", function(data) {
            
            console.log("sandbox send Output");
            console.log(data);
            this.clientSocket.emit("output", { output: data.output });
    
        }.bind(this));

        this.sandboxSocket.on("e", function(data) {
            
            console.log("sandbox send Error");
            this.clientSocket.emit("output", { output: data.error });
    
        }.bind(this));

        this.sandboxSocket.on("end", function(data) {
            
            console.log("end...");
            this.clientSocket.emit("end", { code: data.code });
            
        }.bind(this));
    }
    
    exit() {
        if (this.sandboxSocket) {
            this.sandboxSocket.emit("exit");
        }
    }

}