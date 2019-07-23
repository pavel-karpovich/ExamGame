const AWS = require("aws-sdk");
const { getIpAddress } = require("./utils");

AWS.config.loadFromPath("./config.aws");

const ecs = new AWS.ECS({
  apiVersion: "2014-11-13"
});

const serverAddress = getIpAddress();

class Sandbox {

  constructor(userId, sessionId, clientSocket) {

    let params = {
      cluster: "ExamJsSandbox",
      taskDefinition: "ExamJsSandbox:7",
      count: 1,
      launchType: "FARGATE",
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [
            "subnet-51e98d37",
            "subnet-906e19d8"
          ],
          assignPublicIp: "ENABLED",
          securityGroups: [
            "sg-098232a19bad70019"
          ]
        }
      },
      overrides: {
        containerOverrides: [{
          environment: [{
              name: "SERVER",
              value: serverAddress
            },
            {
              name: "ID",
              value: "" + userId
            },
            {
              name: "SESSION",
              value: "" + sessionId
            }
          ],
          name: "examjs"
        }]
      }
    };
    ecs.runTask(params, function(err, data) {
      if (err) {
        console.log("err when creating ECS task:", err, err.stack);
      }
    });

    this.userId = userId;
    this.updateClientSocket(clientSocket);
    this.sandboxSocket = null;
    this.onTestResults = null;
    this.codeIsRunning = false;
    this.testsIsRunning = false;

  }

  updateClientSocket(clientsNewSocket) {

    this.clientSocket = clientsNewSocket;

    this.clientSocket.on("exec", function (data) {

      data = data || {};
      if (!this.sandboxSocket) {

        console.log("Try to execute code, when container not running yet");
        this.clientSocket.emit("err", {
          error: "Container not running"
        });

      } else if (this.codeIsRunning) {

        console.log("Cannot run code un parallel!");
        this.clientSocket.emit("err", {
          error: "Code is already executing"
        });

      } else {

        console.log("client send RUN");
        this.sandboxSocket.emit("exec", {
          sourceCode: data.sourceCode
        });

      }

    }.bind(this));

    this.clientSocket.on("input", function (data) {

      data = data || {};
      if (!this.sandboxSocket) {

        console.log("Cannot send input, when container is off");
        this.clientSocket.emit("err", {
          error: "Wow.. how did you get to that?"
        });

      } else if (!this.codeIsRunning) {

        console.log("Input can only be proccessed if the code is running");
        this.clientSocket.emit("err", {
          error: "Input can only be proccessed if the code is running"
        });

      } else {

        console.log("client send INPUT");
        this.sandboxSocket.emit("input", {
          input: data.input
        });
      }

    }.bind(this));

    this.clientSocket.on("stop", function () {

      if (!this.sandboxSocket) {

        console.log("Cannot send stop, when container is off");
        this.clientSocket.emit("err", {
          error: "Please, stop sending 'stop' command!"
        });

      } else if (!this.codeIsRunning) {

        console.log("Only a running program can be stopped");
        this.clientSocket.emit("err", {
          error: "Run your code at first"
        });

      } else {

        console.log("client send STOP");
        this.sandboxSocket.emit("stop");

      }

    }.bind(this));

    this.clientSocket.on("test", function (data) {

      data = data || {};
      if (!this.sandboxSocket) {

        console.log("Container not yet connected");
        this.clientSocket.emit("err", {
          error: "The container is off, what other tests?!"
        });

      } else if (this.testsIsRunning) {

        console.log("Unable to run tests in parallel");
        this.clientSocket.emit("err", {
          error: "Wait until the end of the old tests"
        });

      } else {

        console.log("client send TEST");
        this.sandboxSocket.emit("test", {
          sourceCode: data.sourceCode
        });
      }

    }.bind(this));

    this.clientSocket.on("stop-test", function () {

      if (!this.sandboxSocket) {

        console.log("Can't stop tests, when even the container is off");
        this.clientSocket.emit("err", {
          error: "Wait for the container to turn on"
        });

      } else if (!this.testsIsRunning) {

        console.log("Only a running tests can be stopped");
        this.clientSocket.emit("err", {
          error: "You must run tests to stop them!"
        });

      } else {
        console.log("client send STOP TEST");
        this.sandboxSocket.emit("stop-test");
      }

    }.bind(this));

    this.clientSocket.on("load-code", function (data) {

      data = data || {};
      if (!this.sandboxSocket) {

        console.log("Code can not be loaded to the stopped container");
        this.clientSocket.emit("err", {
          error: "Wait for the container to run before loading the source code"
        });

      } else {

        console.log("client load source code");
        this.sandboxSocket.emit("load-code", {
          sourceCode: data.sourceCode
        });

      }
    }.bind(this));

  }

  connect(sandboxSocket) {

    this.sandboxSocket = sandboxSocket;

    this.clientSocket.emit("init");

    this.sandboxSocket.on("start", function () {

      console.log("start...");
      this.codeIsRunning = true;
      this.clientSocket.emit("start");

    }.bind(this));

    this.sandboxSocket.on("output", function (data) {

      data = data || {};
      console.log("sandbox send Output");
      console.log(data);
      this.clientSocket.emit("output", {
        output: data.output
      });

    }.bind(this));

    this.sandboxSocket.on("err", function (data) {

      data = data || {};
      console.log("sandbox send Error");
      this.clientSocket.emit("err", {
        error: data.error
      });

    }.bind(this));

    this.sandboxSocket.on("test-end", function (data) {

      console.log("receiving test results:");
      console.log(data);
      data = data || {};
      if (this.onTestResults) {
        this.onTestResults(data.status, data.results);
      }
      this.testsIsRunning = false;
      this.clientSocket.emit("test-end", {
        status: data.status,
        results: data.results
      });

    }.bind(this));

    this.sandboxSocket.on("start-test", function () {

      console.log("start tests...");
      this.testsIsRunning = true;
      this.clientSocket.emit("start-test");

    }.bind(this));

    this.sandboxSocket.on("exec-end", function (data) {

      data = data || {};
      console.log("execution end...");
      this.clientSocket.emit("exec-end", {
        code: data.code
      });
      this.codeIsRunning = false;

    }.bind(this));

    this.sandboxSocket.on("stop-end", function () {

      console.log("stop command succeed");
      this.clientSocket.emit("stop-end");
      this.codeIsRunning = false;

    }.bind(this));

    this.sandboxSocket.on("stop-test-end", function () {

      console.log("stop test command succeed");
      this.clientSocket.emit("stop-test-end");
      this.testsIsRunning = false;

    }.bind(this));

  }

  loadTests(testsCode) {

    if (!this.sandboxSocket) {

      console.log("Tests can not be loaded to the stopped container");
      this.clientSocket.emit("err", {
        error: "Wait for the container to run before loading the tests"
      });

    } else if (testsCode) {

      console.log("Load tests to the sandbox");
      this.sandboxSocket.emit("load-tests", {
        testsCode
      });
    }

  }

  stopActivity() {

    if (this.codeIsRunning) {
      this.sandboxSocket.emit("stop");
    }
    if (this.testsIsRunning) {
      this.sandboxSocket.emit("stop-test");
    }
  }

  exit() {

    if (this.sandboxSocket) {
      this.sandboxSocket.emit("exit");
    }

  }

}

module.exports = Sandbox;