
const Sandbox = require("./Sandbox");

class Player {

    constructor(id, name) {

        this.id = id;
        this.pos = 1;
        this.total = 0;
        this.score = 0;
        this.outstanding = 0;
        this.name = name;
        this.socket = null;
        this.color = "#FFFFFF";
        this.textureDataUrl = null;
        this.sandbox = null;
        this.completeTask = true;

    }

    createSandbox(sessionId) {

        if (this.socket != null) {

            this.sandbox = new Sandbox(this.id, sessionId, this.socket);
            this.sandbox.onTestResults = (status, results) => {

                console.log(`onTestResult for user ${this.id}`);
                if (status == "passed") {

                    this.completeTask = true;

                }
            }
        }
    }

    updateSocket(newSocket) {

        this.socket = newSocket;
        if (this.sandbox) {

            this.sandbox.updateClientSocket(this.socket);

        }
    }
    
}

module.exports = Player;