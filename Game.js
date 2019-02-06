const Player = require("./Player");
const Tasks = require("./Tasks");

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
        this.tasks = null;

    }

    getPlayersInfo() {

        return this.players.map((pl) => {

            return {
                name: pl.name,
                pos: pl.pos,
                total: pl.total,
                out: pl.outstanding
            };

        });

    }

    getPlayersInfoWithStyle() {

        return this.players.map((pl) => {

            return {
                name: pl.name,
                pos: pl.pos,
                total: pl.total,
                out: pl.outstanding,
                diffuseColor: pl.color,
                textureDataUrl: pl.textureDataUrl
            };

        });

    }

    getPlayerById(id) {
        return this.players.find((pl) => pl.id == id);
    }

    async getTaskForPlayer(player) {
        return this.tasks.getTask(player.pos);
    }

    async getDefaultCodeForPlayer(player) {
        return this.tasks.getDefaultCode(player.pos);
    }

    async loadTestsForPlayer(player) {

        let tests = await this.tasks.getTests(player.pos);
        player.sandbox.loadTests(tests);
    }

    nameIsTaken(username) {
        return this.players.find((pl) => pl.name == username);
    }

    addPlayer(id, name) {

        let newPlayer = new Player(id, name);
        this.players.push(newPlayer);
        if (this.managSocket) {

            this.managSocket.emit("new-player", { 
                name,
                pos: newPlayer.pos,
                total: newPlayer.total,
                out: newPlayer.outstanding
            });

        }

    }

    removePlayer(id) {

        let player = this.players.find((pl) => pl.id == id);
        if (player) {

            this.players = this.players.filter((pl) => pl.id != id);
            return player.name;

        }
        else return undefined;

    }

    clusterBuilder() {

        let i = 0, timeout = 2000;
        let sandboxCreationChain = () => {

            console.log(`Create the Sandbox for the ${i + 1}th Player`);
            this.players[i].createSandbox(this.id);
            i++;
            if (i < this.players.length) {

                setTimeout(sandboxCreationChain, timeout);

            }
        }
        setTimeout(sandboxCreationChain, timeout);

    }

    readySteadyGo() {

        this.state = GameState.RUNNING;
        this.broadcast("start-game");
        this.tasks = new Tasks();
        this.clusterBuilder();

    }

    updatePlayerPositionAndStats(name, path, total, out) {

        this.broadcast("update-player", { name, path, total, out }, name);

    }

    notifyAboutNewPlayer(player) {

        this.broadcast("new-player", { 
            "name": player.name, 
            "pos": player.pos, 
            "total": player.total,
            "out": player.out
        });
        
    }

    notifyAboutPlayerStyle(player) {

        this.broadcast("player-style", {
            "name": player.name,
            "diffuseColor": player.color,
            "textureDataUrl": player.textureDataUrl
        });

    }

    broadcast(type, params, except) {

        for (let player of this.players) {

            if (player.socket && player.name != except) {

                player.socket.emit(type, params);

            }
        }
    }
    
};