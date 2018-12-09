"use strict"

class Die {

    constructor(el) {

        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.step = 0;
        this.el = el;
        this.frames = 0;
        this._forceStop = false;
        this._rolling = false;
        this.onRollingEnd = [];
        
    }

    get sides() {

        return [1, 2, 3, 4, 5, 6];

    }

    get value() {

        return this.sides[this.index];

    }

    _setFinalCoords() {

        let coords = [
            [-95, 0, 5],
            [-5, 95, 0],
            [-5, 5, 0],
            [175, 85, 0],
            [85, 0, -5],
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

        this.frames += 1;
        this.step += 0.01;
        this.x += 5;
        this.y += 20;
        this.z += 5;
        this._setTransform();

        let cb = () => this.rotate();
        if (!this._forceStop || this.frames < 40) {

            window.requestAnimationFrame(cb.bind(this));

        } else {

            this.el.classList.remove("rolling");
            this._setFinalCoords();
            for (let cb of this.onRollingEnd) {

                setTimeout(cb, 1500);

            }

        }

    }

    isRolling() {

        return this._rolling;

    }

    startRoll() {

        this._rolling = true;
        this._forceStop = false;
        this.el.classList.add("rolling");
        this.frames = 0;
        this.onRollingEnd = [
            () => this._rolling = false
        ];
        this.onRollingEnd[0].bind(this);
        this.rotate();

    }
    
    endRoll(val, callback) {

        this.index = val - 1;
        if (callback) {
        
            this.onRollingEnd.push(callback);
        
        }
        this._forceStop = true;

    }

}