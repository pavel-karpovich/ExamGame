let cells = [];
let sessionName;
let username;

const SPEED = 0.7; // 0.3

const BLEND_TIME  = {
    IdleToWalk: 500,
    WalkToIdle: 1000
}


class Ghost {

    constructor(initPos, playerMesh, idleAnim, walkAnim) {

        this._mesh = playerMesh;

        this.idleAnim = idleAnim;
        this.walkAnim = walkAnim;

        this._cell = initPos;
        this._needMove = false;
        this._walkPath = [];
        this.deltaTime = 0;
        this.FPS = FPS_FOR_NET;

    }

    get mesh() {

        return this._mesh;

    }

    get cell() {

        return this._cell;

    }

    _getRandomHeight() {

        return Math.random() * 2 + 1;

    }

    _calculate() {

        this._cell = this._walkPath.shift();
        this.targetPos = cells[this._cell - 1].mesh.position.clone();
        this.targetPos.y += this._getRandomHeight();
        this._mesh.lookAt(this.targetPos, 0, -Math.PI * 0.4);
        let deltaVec = this.targetPos.subtract(this._mesh.position);
        let hyp = Math.sqrt(Math.pow(deltaVec.x, 2) + Math.pow(deltaVec.z, 2));
        let hypY = Math.sqrt(Math.pow(hyp, 2) + Math.pow(deltaVec.y, 2));
        this.epsVector = new BABYLON.Vector3(
            (deltaVec.x / hyp) * SPEED,
            (deltaVec.y / hypY) * SPEED,
            (deltaVec.z / hyp) * SPEED
        );
        this.normale = this.epsVector = this.epsVector.normalize();

    }

    _blendStep(from, to, delta) {

        if (from.weight == 0.0) {

            return;

        } else {

            from.weight -= delta;
            to.weight = 1.0 - from.weight;
            setTimeout(this._blendStep.bind(this), 1000 / 30, from, to, delta);

        }

    }

    blendAnim(from, to, time) {

        let delta = (1000 / 30) / time;
        from.weight = 1.0;
        to.weight = 0.0;
        to.syncWith(null);
        from.syncWith(to);
        setTimeout(this._blendStep.bind(this), 1000 / 15, from, to, delta);

    }

    goby(path) {
       
        if (!this._needMove) {

            this._walkPath = path;
            this.blendAnim(this.idleAnim, this.walkAnim, BLEND_TIME.IdleToWalk);
            this._calculate();
            this._needMove = true;

        } else {

            console.log("Walk rejected!");

        }

    }

    move(deltaTime) {

        let ratio = deltaTime * this.FPS / 1000;
        let alignedEps = this.epsVector.scale(ratio * SPEED);
        let nextPosition = this._mesh.position.add(alignedEps);
        let nextNormale = this.targetPos.subtract(nextPosition);//.normalize();
        if (Math.sign(nextNormale.x) != Math.sign(this.normale.x) &&
            Math.sign(nextNormale.y) != Math.sign(this.normale.y) &&
            Math.sign(nextNormale.z) != Math.sign(this.normale.z)
        ) {

            // Stop walking;
            if (this._walkPath.length == 0) {

                this._needMove = false;
                this.targetPos = this._mesh.position;
                this.blendAnim(this.walkAnim, this.idleAnim, BLEND_TIME.WalkToIdle);
                let task = document.querySelector(".window.task-window"); 
                task.classList.remove("invisible");

            } else {

                this._calculate();

            }

        } else {

            this._mesh.position.addInPlace(alignedEps);

        }

    }

    isGoing() {

        return this._needMove;

    }

}