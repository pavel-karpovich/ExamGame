

class Player {

    constructor(name, socket) {

        this.position = 0;
        this.name = name;
        this.socket = socket;

    }

    setPos(num) {

        this.position = num;

    }

    getPos() {

        return this.position;

    }
}

module.exports = Player;