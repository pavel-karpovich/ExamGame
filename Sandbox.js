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

        this.userId = userId;
        this.clientSocket = clientSocket;
        this.sandboxSocket = null;
        this.onTestResults = null;

        this.clientSocket.on("run", function(data) {

            data = data || {};
            if (this.sandboxSocket) {
                console.log("client send RUN");
                this.sandboxSocket.emit("exec", { sourceCode: data.sourceCode });
            }
    
        }.bind(this));
    
        this.clientSocket.on("input", function(data) {
    
            data = data || {};
            if (this.sandboxSocket) {
                console.log("client send INPUT");
                this.sandboxSocket.emit("i", { input: data.input });
            }
    
        }.bind(this));

        this.clientSocket.on("stop", function() {

            if (this.sandboxSocket) {
                console.log("client send STOP");
                this.sandboxSocket.emit("stop");
            }
        }.bind(this));

        this.clientSocket.on("test", function(data) {

            data = data || {};
            if (this.sandboxSocket) {
                console.log("client send TEST");
                this.sandboxSocket.emit("test", { sourceCode: data.sourceCode });
            }
        }.bind(this));

    }

    connect(sandboxSocket) {
        this.sandboxSocket = sandboxSocket;
        
        this.sandboxSocket.on("start", function() {

            console.log("start...");
            this.clientSocket.emit("start");

        }.bind(this));

        this.sandboxSocket.on("o", function(data) {
            
            data = data || {};
            console.log("sandbox send Output");
            console.log(data);
            this.clientSocket.emit("output", { output: data.output });
    
        }.bind(this));

        this.sandboxSocket.on("e", function(data) {
            
            data = data || {};
            console.log("sandbox send Error");
            this.clientSocket.emit("output", { output: data.error });
    
        }.bind(this));

        this.sandboxSocket.on("result", function(data) {

            console.log("receiving test results:");
            console.log(data);
            data = data || {};
            if (this.onTestResults) {
                this.onTestResults(data.status, data.results);
            }
            this.clientSocket.emit("result", { status: data.status, results: data.results });
        }.bind(this));

        this.sandboxSocket.on("end", function(data) {
            
            data = data || {};
            console.log("end...");
            this.clientSocket.emit("end", { code: data.code });
            
        }.bind(this));
    }

    loadTests(testsCode) {

        if (testsCode && this.sandboxSocket) {

            console.log("Load tests to the sandbox");
            this.sandboxSocket.emit("load-tests", { testsCode });
        }

    }
    
    exit() {
        if (this.sandboxSocket) {
            this.sandboxSocket.emit("exit");
        }
    }

}