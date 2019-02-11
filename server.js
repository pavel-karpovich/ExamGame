// Dependencies
const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");

const express = require("express");
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser");
const socketIO = require("socket.io");
const mustache = require("mustache-express");

const app = express();
const httpServer = http.createServer(app);
let io = null;

const { getRandomId, getCookie, getQueryParams, randomDice } = require("./utils");
let { GameSession, GameState } = require("./Game");
const Sandbox = require("./Sandbox");
const { getPath } = require("./Level");

let gameSessions = new Array();

const PORT = 80;
// 30 minutes
const PREPARING_TIME_LIMIT = 2 * 60 * 60 * 1000;
const COOKIE_AGE = 5 * 60 * 60 * 1000;
const MAX_USERNAME_LENGTH = 30;

const ManageGameState = {
    NONE: "none",
    PREPARE: "prepare",
    GAME: "game",
    END: "end"
}

const PlayerGameState = {
    UNAUTH: "unauth",
    LOBBY: "lobby",
    INGAME: "ingame",
    ENDING: "ending"
}

function endGame() {

}
const enableTLS = process.argv[2];

if (enableTLS == "-s") {

    const privateKeyPath = process.env.GAME_PRIVATE_KEY_PATH;
    const certificatePath = process.env.GAME_CERTIFICATE_PATH;
    const caPath = process.env.GAME_CA_PATH;

    const privateKey = fs.readFileSync(privateKeyPath, "utf8");
    const certificate = fs.readFileSync(certificatePath, "utf8");
    const ca = fs.readFileSync(caPath, "utf8");

    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };

    const httpsServer = https.createServer(credentials, app);
    io = socketIO(httpsServer);

    httpsServer.listen(443, "0.0.0.0", function() {

        console.log(`Starting HTTPS server on port 443`);

    });
    
    app.use(function(req, res, next) {
        if(!req.secure) {
            return res.redirect(["https://", req.get("Host"), req.url].join(""));
        }
        next();
    });
} else {
    
    io = socketIO(httpServer);

}

app.engine("html", mustache());
app.set("port", PORT);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "templates"));

app.use(cookieParser());
app.use(bodyParser.json());
app.use("/static", express.static(__dirname + "/static"));
app.use("/node_modules", express.static(__dirname + "/node_modules"));
app.use(express.static(__dirname, { dotfiles: "allow" } ));
    
app.get("/editor", function(request, response) {

    fs.readFile(path.join(__dirname, "task", "1", "startup.cs"), "utf8", function(err, startup) {

        fs.readFile(path.join(__dirname, "task", "1", "definition.md"), "utf8", function(err, definition) {

            response.render("test.html", { startup, definition });

        });
    });

});

app.get("/", function(request, response) {

    response.sendFile(path.join(__dirname, "index.html"));

});
app.get("/manage", function(request, response) {

    response.sendFile(path.join(__dirname, "manage.html"));

});
app.post("/manage", function(request, response) {

    let responseJson = {
        sessionState: ManageGameState.NONE
    };
    let sessionId = request.cookies["manage"];
    let game = gameSessions.find((gm) => gm.id == sessionId);
    if (game) {

        if (game.state == GameState.LOBBY) {

            responseJson.directLink =
                request.protocol + "://" + request.get("host") + "/game?session=" + sessionId;
            responseJson.players = game.getPlayersInfo();
            responseJson.sessionState = ManageGameState.PREPARE;

        } else if (game.state == GameState.RUNNING) {

            responseJson.players = game.getPlayersInfo();
            responseJson.sessionState = ManageGameState.GAME;

        }

    }
    response.json(responseJson);

});
app.post("/manage/create", function(request, response) {

    let responseJson = {};
    if (request.body) {

        let name = request.body.name;
        let lifetime = request.body.time;
        if (name && lifetime >= 5 && lifetime <= 180) {

            do {

                uniqueId = getRandomId();

            } while (gameSessions.find((gm) => gm.id == uniqueId));
            let game = new GameSession(uniqueId, name, lifetime);
            let cb = (id) => {

                return () => {

                    let gm = gameSessions.find((gm) => gm.id == id);
                    if (gm) {

                        if (gm.state == GameState.LOBBY) {

                            gameSessions = gameSessions.filter((gm) => gm.id != id);

                        }

                    }

                }

            };
            setTimeout(cb(uniqueId), PREPARING_TIME_LIMIT);
            game.onEnd = endGame; // TODO
            gameSessions.push(game);
            responseJson.directLink =
                request.protocol + "://" + request.get("host") + "/game?session=" + uniqueId;
            responseJson.players = [];
            response.cookie("manage", uniqueId, { maxAge: COOKIE_AGE, httpOnly: true });

        }

    }
    response.json(responseJson);

});

app.post("/manage/start", function(request, response) {

    let responseJson = {};
    let sessionId = request.cookies["manage"];
    let game = gameSessions.find((gm) => gm.id == sessionId);
    if (game) {

        game.readySteadyGo();

    } else {

        responseJson.error = "Invalid SessionID";

    }
    response.json(responseJson);

});
app.get("/game", function(request, response) {

    let sessionId = request.query.session;
    if (sessionId) {

        let game = gameSessions.find((gm) => gm.id == sessionId);
        if (game) {

            response.sendFile(path.join(__dirname, "game.html"));

        } else {

            response.status(404).sendFile(path.join(__dirname, "404.html"));
            
        }

    } else {

        response.sendFile(path.join(__dirname, "list.html"));

    }

});
app.post("/game", function(request, response) {

    let sessionId = request.body.sessionId;
    let responseJson = {
        playerState: PlayerGameState.UNAUTH
    };
    let playerId = request.cookies[sessionId];
    let game = gameSessions.find((gm) => gm.id == sessionId);
    if (game) {
    
        responseJson.sessionName = game.name;
        let player = game.getPlayerById(playerId);
        if (player) {

            responseJson.username = player.name;

            if (game.state == GameState.LOBBY) {
                
                responseJson.playerList = game.getPlayersInfo();
                responseJson.playerState = PlayerGameState.LOBBY;

            } else if (game.state == GameState.RUNNING) {

                responseJson.playerState = PlayerGameState.INGAME;
                responseJson.playerList = game.getPlayersInfoWithStyle();
                responseJson.task = !player.completeTask;
                responseJson.leave = player.canLeave;
                responseJson.container = player.sandbox.sandboxSocket ? true : false;

            }

        } else {

            if (game.state != GameState.LOBBY) {
                
                responseJson.error = "Game already running. Can't join.";
                responseJson.sessionName = game.name;
    
            }

        }

    }
    response.json(responseJson);

});
app.post("/game/reg", function(request, response) {

    let responseJson = {};
    if (request.body) {

        let username = request.body.username;
        let sessionId = request.body.sessionId;
        let game = gameSessions.find((gm) => gm.id == sessionId);
        if (game) {

            if (game.state == GameState.LOBBY) {

                if (!username || username.length > MAX_USERNAME_LENGTH || game.nameIsTaken(username)) {
                    
                    responseJson.error = "The game is already running. Cannot join.";
                    
                } else {
                    
                    do {

                        userId = getRandomId();

                    } while (game.getPlayerById(userId));

                    game.addPlayer(userId, username);
                    responseJson.playerList = game.getPlayersInfo();

                    response.cookie(sessionId, userId, { maxAge: COOKIE_AGE, httpOnly: true });

                }

            }

        }

    }
    response.json(responseJson);

});
app.post("/game/dice", function(request, response) {

    let responseJson = {};
    let sessionId = request.body.sessionId;
    let playerId = request.cookies[sessionId];
    let game = gameSessions.find((gm) => gm.id == sessionId);
    if (game) {

        let player = game.getPlayerById(playerId);
        if (player) {
            
            if (player.completeTask) {
                
                let dice = randomDice();
                let path = getPath(player.pos, dice);
                player.pos = path[path.length - 1];
                
                ++player.total;
                game.updatePlayerPositionAndStats(player.name, path, player.total, player.outstanding);

                player.completeTask = false;
                responseJson.dice = dice;
                responseJson.total = player.total;
                responseJson.path = path;
                responseJson.out = player.outstanding;

            } else {

                console.log(`Player ${playerId} try to cheat!`);
                responseJson.error = "You must complete the task!";

            }
        }
    }
    response.json(responseJson);

});
app.post("/game/task", async function(request, response) {
    
    let responseJson = {};
    let sessionId = request.body.sessionId;
    let playerId = request.cookies[sessionId];
    let game = gameSessions.find((gm) => gm.id == sessionId);
    if (game) {

        let player = game.getPlayerById(playerId);
        if (player) {

            responseJson.startup = await game.getDefaultCodeForPlayer(player);
            responseJson.definition = await game.getTaskForPlayer(player);
            game.loadTestsForPlayer(player);
            player.startTaskTimer();

        }
    }
    response.json(responseJson);
});
app.use(function(reqest, response, next) {

    response.status(404).sendFile(path.join(__dirname, "404.html"));

});

io.of("manage")
    .on("connection", function(socket) {

        console.log(socket.id + " Manager connected!");
        let sessionId = getCookie(socket.handshake.headers.cookie, "manage");
        let game = gameSessions.find((gm) => gm.id == sessionId);
        if (game) {

            game.managSocket = socket;

        } else {

            socket.disconnect();
            console.log(this.id + " Manager disconnected!");

        }
        socket.on("disconnect", function() {

            console.log(this.id + " Manager disconnected!");

        });

    });

io.of("game")
    .on("connection", function(socket) {

        let sessionId = getQueryParams(socket.handshake.headers.referer)["session"];
        let playerId = getCookie(socket.handshake.headers.cookie, sessionId);
        let game = gameSessions.find((gm) => gm.id == sessionId);
        let player = null;
        if (game) {

            player = game.getPlayerById(playerId);
            if (player) {

                console.log(`Player ${player.name} connected!`);
                player.updateSocket(socket);
                game.notifyAboutNewPlayer(player);

            }

        } else {

            console.log("Unknown player disconnected!");
            socket.disconnect();

        }
        socket.on("disconnect", function() {

            console.log((player ? player.name : "Some player") + " disconnected!");

        });
        socket.on("player-style", function(data) {

            if (!player || !data.diffuseColor || !data.textureDataUrl) {

                return;

            }
            console.log("Update style for " + player.name);
            player.textureDataUrl = data.textureDataUrl;
            player.color = data.diffuseColor;
            game.notifyAboutPlayerStyle(player);

        });
        socket.on("message", function(data) {

            game.broadcast("message", { sender: player.name, text: data.text });

        });
        socket.on("leave", function() {

            if (player.canLeave) {

                player.leaveTask();
                console.log(`Player ${player.name} leave. Fuuuu!`);

            } else {

                console.log(`${player.name} try to cheat with premature leaving!`);
                this.emit("err", {
                    error: "You can't leave now, little dirty cheater!"
                });

            }

        });

    });


let clientTestSocket = null;
let testId = 111;
let testSandbox = null;

io.of("test")
.on("connection", function(socket){

    console.log("client connect, creating container...");
    clientTestSocket = socket;
    testSandbox = new Sandbox(testId, 0, clientTestSocket);

});

io.of("sandbox")
.on("connection", function(socket) {

    console.log("Wow! Sandbox socket connected!");
    let playerId = socket.handshake.query.id;
    let sessionId = socket.handshake.query.session;
    // in test case
    if (playerId == testId) {

        testSandbox.connect(socket);
        fs.readFile(path.join(__dirname, "task", "1", "tests.cs"), function(err, fileContent) {
            testSandbox.loadTests(fileContent);
        });
        return;

    }
    let game = gameSessions.find((gm) => gm.id == sessionId);
    if (game) {

        player = game.getPlayerById(playerId);
        if (player) {

            player.sandbox.connect(socket);
            game.loadTestsForPlayer(player);

        } else {

            console.log("It can't be!");
        }
    }

});

httpServer.listen(PORT, "0.0.0.0", function() {

    console.log(`Starting HTTP server on port ${PORT}`);

});


// TODO: 
// > add React. Just do it
// > clear game data after the preapring time is out, and game not start
// > remove player if they don't connect (socket is null) too long
// > use a package manager (apt-get) in Dockerfile is a bad form
// > what about TypeScript man?
// > Locking and sync fs operation? No, have not heard