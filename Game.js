const HashMap = require("hashmap");
const Player = require("./Player");

const GameState = {
    LOBBY : "lobby",
    RUNNING : "running",
    ENDING : "ending"
};
Object.freeze(GameState);

module.exports.GameState = GameState;


module.exports.GameSession = class {

    constructor(id, name, lifetime) {

        this.id = id;
        this.name = name;
        this.time_left = lifetime;
        this.players = new HashMap();
        this.managSocket = null;
        this.state = GameState.LOBBY;

    }

    getPlayersInfo() {

        return this.players.values().map((player) => {

            return {
                name: player.name
            };

        });

    }

    getPlayerById(id) {

        return this.players.get(id);

    }

    nameIsTaken(username) {

        return this.players.values().find((player) => player.name == username);

    }

    addPlayer(id, name, socket) {

        this.players.set(id, new Player(name, socket));
        if (this.managSocket) {

            this.managSocket.emit("new-player", { name });

        }
        for (let player of this.players.values()) {

            if (player.socket) {

                player.socket.emit("new-player", { name });

            }

        }

    }

    removePlayer(id) {

        let player = {};
        if (this.players.has(id)) {

            player = this.players.get(id);
            this.players.remove(id);

        }
        return player.name;

    }

    readySteadyGo() {

        this.state = GameState.RUNNING;
        for (let player of this.players.values()) {

            if (player.socket) {

                player.socket.emit("start-game");

            }

        }

    }
    
};