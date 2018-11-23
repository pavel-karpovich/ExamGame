let cells = [];
let sessionName;
let username;

const SPEED = 0.7;//0.3;

function getRandomRotation() {

    let rndAngle = Math.random() * 2 * Math.PI;
    return new BABYLON.Vector3( -Math.PI * 0.4, rndAngle, 0);

}

function getRandomPosition(initVec) {

    return new BABYLON.Vector3(
        initVec.x + Math.random() * 10 - 5,
        initVec.y + Math.random() * 2,
        initVec.z + Math.random() * 10 - 5
    );

}


class Ghost {

    constructor(name, initPos) {

        this._mesh = Ghost.origin.clone("m_" + name);
        this._mesh.skeleton = Ghost.origin.skeleton.clone("s_" + name);
        this._mesh.position = getRandomPosition(cells[initPos - 1].mesh.position);
        this._mesh.rotation = getRandomRotation();
        this._mesh.visibility = 1;
        //this._mesh.checkCollisions = true;

        this._mesh.skeleton.beginAnimation("fantome|idle_porter|Baked frames", true);

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

    goby(path) {
       
        if (!this._needMove) {

            this._walkPath = path;
            this._mesh.skeleton.beginAnimation("fantome|marcher|Baked frames", true);
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
        let nextNormale = this.targetPos.subtract(nextPosition).normalize();
        if (Math.sign(nextNormale.x) != Math.sign(this.normale.x) &&
            Math.sign(nextNormale.y) != Math.sign(this.normale.y) &&
            Math.sign(nextNormale.z) != Math.sign(this.normale.z)
        ) {

            //this._mesh.position = this.targetPos;
            if (this._walkPath.length == 0) {

                this._needMove = false;
                this.targetPos = this._mesh.position;
                this._mesh.skeleton.beginAnimation("fantome|idle|Baked frames", true);

            } else {

                this._calculate();

            }

        } else {

            this._mesh.position = nextPosition;

        }

    }

    isGoing() {

        return this._needMove;

    }

}

Ghost.origin = null;