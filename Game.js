const Player = require("./Player");
const Tasks = require("./Tasks");
const { getRandomId } = require("./utils");

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
        this.links = [];
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
        return newPlayer;

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

        if (this.players.length == 0) {
            return;
        }
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

    connectPlayer(player) {

        player.socket.emit("start-game");
        player.createSandbox(this.id);
        player.belated_state = undefined;
        this.broadcast("belated-connect", { name: player.name })
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

    getIdForBelatedLink() {

        let uniqueLinkId = null;
        do {
            
            uniqueLinkId = getRandomId();

        } while(this.links.find(lk => lk == uniqueLinkId));
        this.links.push(uniqueLinkId);
        return uniqueLinkId;

    }

    isActualFreeLink(plid) {

        return this.links.find(lk => lk == plid) ? true : false;

    }

    assignLink(player, link) {

        this.links = this.links.filter(lk => lk != link);
        player.belated_state = GameState.LOBBY;
        this.managSocket.emit("take-link", { link });
    }
    
};