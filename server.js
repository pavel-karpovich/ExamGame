// Dependencies
const express = require("express");
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser");
const http = require("http");
const path = require("path");
const { exec } = require("child_process");
const socketIO = require("socket.io");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const { getRandomId, getCookie, getQueryParams, randomDice } = require("./utils");
let { GameSession, GameState } = require("./Game");
const { Sandbox } = require("./Sandbox");
const { getPath } = require("./Level");

let gameSessions = new Array();

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

app.set("port", 8081);

app.use(cookieParser());
app.use(bodyParser.json());
/*
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
*/
app.use("/static", express.static(__dirname + "/static"));


app.get("/test", function(request, response) {

    response.sendFile(path.join(__dirname, "test.html"));

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
            
            let dice = randomDice();
            let path = getPath(player.pos, dice);
            player.pos = path[path.length - 1];
            
            ++player.total;
            game.updatePlayerPositionAndStats(player.name, path, player.total);

            responseJson.dice = dice;
            responseJson.total = player.total;
            responseJson.path = path;
            
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
                game.notifyAboutNewPlayer(player);
                player.socket = socket;

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

    });

let clientTestSocket = null;
let testId = 111;

io.of("test")
.on("connection", function(socket){

    console.log("client connect, creating container...");
    clientTestSocket = socket;
    sandbox = new Sandbox(testId, clientTestSocket);

});

io.of("sandbox")
.on("connection", function(socket) {

    console.log("Wow! Sandbox socket connected!");
    if (socket.handshake.query.id != testId) {

        console.log("Id not equals!");
        return -1;

    }
    sandbox.connect(socket);

});

server.listen(8081, "0.0.0.0", function() {

    console.log("Starting server on port 8081");

});

// TODO: just add react. Do it
// TODO: clear game data after the preapring time is out, and game not start
// TODO: remove player if they don't connect (socket is null) too long