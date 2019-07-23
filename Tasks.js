const { readFileAsync } = require("./utils");

const tasksCount = 11;

class Tasks {

    constructor() {
    }

    async getTask(pos) {
        const taskNum = (pos - 1) % tasksCount;
        return await readFileAsync(__dirname + `/task/${taskNum}/definition.md`);
    }

    async getDefaultCode(pos) {
        const taskNum = (pos - 1) % tasksCount;
        return await readFileAsync(__dirname + `/task/${taskNum}/startup.cs`);
    }

    async getTests(pos) {
        const taskNum = (pos - 1) % tasksCount;
        return await readFileAsync(__dirname + `/task/${taskNum}/tests.cs`);
    }
}

module.exports = Tasks;