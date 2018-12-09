

class Player {

    constructor(id, name) {

        this.id = id;
        this._position = 1;
        this.name = name;
        this.socket = null;
        this.total = 0;
        this._color = "#FFFFFF";
        this.textureDataUrl = null;

    }

    set pos(num) {

        this._position = num;

    }

    get pos() {

        return this._position;

    }

    set color(col) {
        
        this._color = col;

    }

    get color() {

        return this._color;
        
    }
    
}

module.exports = Player;