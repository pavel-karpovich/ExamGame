class Die {

    constructor(el) {

        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.step = 0;
        this.el = el;
        
    }

    get sides() {

        return [1, 2, 3, 4, 5, 6];

    }



    get value() {

        return this.sides[this.index];

    }

    _setFinalCoords() {

        let coords = [
            [85, 0, -5],
            [-5, 95, 0],
            [-5, 5, 0],
            [-5, 95, 0],
            [-95, 0, 5],
            [-5, 185, 0]
        ][this.index];

        this.x = coords[0];
        this.y = coords[1];
        this.z = coords[2];

        this._setTransform();

    }

    _setTransform() {

        let transform =
            `rotateX(${this.x}deg) rotateY(${this.y}deg) rotateZ(${this.z}deg)`;
        this.el.style.webkitTransform = transform;
        this.el.style.transform = transform;

    }

    rotate() {

        this.step += 0.01;
        this.x += 5;
        this.y += 20;
        this.z += 5;
        this._setTransform();

        let cb = () => this.rotate();
        if (this.__rolling) {

            window.requestAnimationFrame(cb.bind(this));

        }

    }

    startRoll() {

        this.__rolling = true;
        this.el.classList.add("rolling");
        this.rotate();

    }
    
    endRoll(val) {

        this.index = val;
        this.__rolling = false;
        this.el.classList.remove("rolling");
        this._setFinalCoords();

    }

}