const { readFileAsync } = require("./utils");

class Tasks {

    constructor() {
    }

    async getTask(pos) {
        return await readFileAsync(__dirname + `/task/${pos}/definition.md`);
    }

    async getDefaultCode(pos) {
        return await readFileAsync(__dirname + `/task/${pos}/startup.cs`);
    }

    async getTests(pos) {
        return await readFileAsync(__dirname + `/task/${pos}/tests.cs`);
    }
}

module.exports = Tasks;