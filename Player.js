
const Sandbox = require("./Sandbox");

// time on 1 task execution
const TASK_TIME = 10 * 60 * 1000; 

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
        this.canLeave = false;
        this._leaveTimer = null;
    }

    createSandbox(sessionId) {

        if (this.socket != null) {

            this.sandbox = new Sandbox(this.id, sessionId, this.socket);
            this.sandbox.onTestResults = (status, results) => {

                console.log(`onTestResult for user ${this.name}`);
                if (status == "passed") {

                    this.prepareToNextTask();

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

    startTaskTimer() {

        this._leaveTimer = setTimeout(() => {
            
            this.canLeave = true;
            console.log(`User ${this.name} now can leave`);
            this.socket.emit("leave");

        }, TASK_TIME);

    }

    prepareToNextTask() {

        this.sandbox.stopActivity();
        this.completeTask = true;
        this.canLeave = false;
        clearTimeout(this._leaveTimer);
        this._leaveTimer = null;

    }

    leaveTask() {

        this.outstanding++;
        this.prepareToNextTask();
    }
    
}

module.exports = Player;