// Dependencies
const express = require("express");
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const HashMap = require("hashmap");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const { ID, getCookie, randomDice } = require("./utils");
let { GameSession, GameState } = require("./Game");

let gameSessions = new HashMap();

// 30 minutes
const PREPARING_TIME_LIMIT = 30 * 60 * 1000;
const COOKIE_AGE = 5 * 60 * 60 * 1000;

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

app.set("port", 5000);

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

app.get("/", function(request, response) {

    response.sendFile(path.join(__dirname, "index.html"));

});

app.get("/manage", function(request, response) {

    response.sendFile(path.join(__dirname, "manage.html"));

});
app.post("/manage", function(request, response) {

    responseJson = {
        sessionState: ManageGameState.NONE
    };
    sessionId = request.cookies["manage"];
    if (sessionId) {

        game = gameSessions.get(sessionId);
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

    }
    response.json(responseJson);

});
app.post("/manage/create", function(request, response) {

    responseJson = {};
    if (request.body) {

        let name = request.body.name;
        let lifetime = request.body.time;
        if (name && lifetime >= 5 && lifetime <= 180) {

            do {

                uniqueId = ID();

            } while (gameSessions.get(uniqueId));
            game = new GameSession(uniqueId, name, lifetime);
            let cb = (id) => {

                return () => {

                    let gm = gameSessions.get(id);
                    if (gm) {

                        if (gm.state == GameState.LOBBY) {

                            gameSessions.delete(id);

                        }

                    }

                }

            };
            setTimeout(cb(uniqueId), PREPARING_TIME_LIMIT);
            game.onEnd = endGame; // TODO
            gameSessions.set(uniqueId, game);
            responseJson.directLink =
                request.protocol + "://" + request.get("host") + "/game?session=" + uniqueId;
            responseJson.players = [];
            response.cookie("manage", uniqueId, { maxAge: COOKIE_AGE, httpOnly: true });

        }

    }
    response.json(responseJson);

});

app.post("/manage/start", function(request, response) {

    responseJson = {};
    sessionId = request.cookies["manage"];
    if (sessionId) {

        game = gameSessions.get(sessionId);
        if (game) {

            game.readySteadyGo();

        } else {

            responseJson.error = "Invalid SessionID";

        }

    }
    response.json(responseJson);

});
app.get("/game", function(request, response) {

    let sessionId = request.query.session;
    if (sessionId) {

        game = gameSessions.get(sessionId);
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

    let sessionId = request.cookies["session"];
    let playerId = request.cookies["player"];
    let responseJson = {
        playerState: PlayerGameState.UNAUTH
    };
    let game;
    if (playerId && sessionId) {

        game = gameSessions.get(sessionId);
        if (game) {

            let player = game.getPlayerById(playerId);
            if (player) {

                if (game.state == GameState.LOBBY) {
                    
                    responseJson.playerState = PlayerGameState.LOBBY;

                } else if (game.state == GameState.RUNNING) {

                    responseJson.playerState = PlayerGameState.INGAME;

                }

            }

        }

    }
    if (responseJson.playerState == PlayerGameState.UNAUTH) {

        sessionId = request.body.sessionId;
        game = gameSessions.get(sessionId);
        if (game.state != GameState.LOBBY) {
            
            responseJson.error = "Game already running. Can't join.";

        }

    }
    responseJson.sessionName = game.name;
    response.json(responseJson);

});
app.post("/game/reg", function(request, response) {

    let responseJson = {};
    if (request.body) {

        let username = request.body.username;
        let sessionId = request.body.sessionId;
        let game = gameSessions.get(sessionId);
        if (game) {

            if (game.state == GameState.LOBBY) {

                if (username && !game.nameIsTaken(username)) {

                    do {

                        userId = ID();

                    } while (game.getPlayerById(userId));

                    game.addPlayer(userId, username, null);

                    response.cookie("session", sessionId, { maxAge: COOKIE_AGE, httpOnly: true });
                    response.cookie("player", userId, { maxAge: COOKIE_AGE, httpOnly: true });

                } else {

                    responseJson.error = "Please, change the name.";

                }

            } else {

                responseJson.error = "The game is already running. Cannot join.";

            }

        }

    }
    response.json(responseJson);

});
app.post("/game/dice", function(request, response) {

    responseJson = {};
    let dice = randomDice();
    responseJson.dice = dice;
    response.json(responseJson);

});

app.use(function(reqest, response, next) {

    response.status(404).sendFile(path.join(__dirname, "404.html"));

});

io.of("manage")
    .on("connection", function(socket) {

        console.log(socket.id + " Manager connected!");
        sessionId = getCookie(socket.handshake.headers.cookie, "manage");
        game = gameSessions.get(sessionId);
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

        console.log(socket.id + " Player connected!");
        sessionId = getCookie(socket.handshake.headers.cookie, "session");
        playerId = getCookie(socket.handshake.headers.cookie, "player");
        game = gameSessions.get(sessionId);
        if (game) {

            player = game.getPlayerById(playerId);
            if (player) {

                player.socket = socket;
                player.socket.emit("player-list", game.getPlayersInfo());

            }

        } else {

            socket.disconnect();
            console.log(this.id + " Player disconnected!");

        }
        socket.on("disconnect", function() {

            console.log(this.id + " Player disconnected!");

        });

    });


server.listen(5000, function() {

    console.log("Starting server on port 5000");

});

// TODO: just add react. Do it
// TODO: clear game data after the preapring time is out, and game not start
// TODO: remove player if they not connect (socket is null) too long