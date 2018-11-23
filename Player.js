

class Player {

    constructor(id, name) {

        this.id = id;
        this._position = 1;
        this.name = name;
        this.socket = null;
        this.total = 0;

    }

    set pos(num) {

        this._position = num;

    }

    get pos() {

        return this._position;

    }
    
}

module.exports = Player;