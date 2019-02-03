
const Sandbox = require("./Sandbox");

class Player {

    constructor(id, name) {

        this.id = id;
        this.pos = 1;
        this.total = 0;
        this.score = 0;
        this.name = name;
        this.socket = null;
        this.color = "#FFFFFF";
        this.textureDataUrl = null;
        this.sandbox = null;

    }

    createSandbox(sessionId) {

        if (this.socket != null) {

            this.sandbox = new Sandbox(this.id, sessionId, this.socket);

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