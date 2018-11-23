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
        this.players = new Array();
        this.managSocket = null;
        this.state = GameState.LOBBY;

    }

    getPlayersInfo() {

        return this.players.map((pl) => {

            return {
                name: pl.name,
                pos: pl.pos,
                total: pl.total
            };

        });

    }

    getPlayerById(id) {

        return this.players.find((pl) => pl.id == id);

    }

    nameIsTaken(username) {

        return this.players.find((pl) => pl.name == username);

    }

    addPlayer(id, name) {

        let newPlayer = new Player(id, name);
        this.players.push(newPlayer);
        if (this.managSocket) {

            this.managSocket.emit("new-player", { name,  pos: newPlayer.pos, total: newPlayer.total });

        }

    }

    removePlayer(id) {

        let player = this.players.find((pl) => pl.id == id);
        if (player) {

            this.players = this.players.filter((pl) => pl.id != id);
            return player.name;

        }
        else {
        
            return undefined;
        }

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

        for (let player of this.players) {

            if (player.socket && player.name != except) {

                player.socket.emit(type, params);

            }

        }

    }
    
};