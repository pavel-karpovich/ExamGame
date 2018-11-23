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
                name: player.name,
                pos: player.pos,
                total: player.total
            };

        });

    }

    getPlayerById(id) {

        return this.players.get(id);

    }

    nameIsTaken(username) {

        return this.players.values().find((player) => player.name == username);

    }

    addPlayer(id, name) {

        let newPlayer = new Player(name);
        this.players.set(id, newPlayer);
        if (this.managSocket) {

            this.managSocket.emit("new-player", { name,  pos: newPlayer.pos, total: newPlayer.total });

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
        this.broadcast("start-game");

    }

    updatePlayerPositionAndStats(name, path, total) {

        this.broadcast("update-player", { name, path, total }, name);

    }

    notifyAboutNewPlayer(name, pos, total) {

        this.broadcast("new-player", { name, pos, total });
        
    }


    broadcast(type, params, except) {

        for (let player of this.players.values()) {

            if (player.socket && player.name != except) {

                player.socket.emit(type, params);

            }

        }

    }
    
};