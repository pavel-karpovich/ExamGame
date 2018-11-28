
let onGameRendered = null;
let players = [];
let localGhost = null;

const FPS_FOR_OWNER = 40;
const FPS_FOR_NET = 20;
let v;
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

function renderGame() {


    let canvas = document.getElementById("scene");
    let engine = new BABYLON.Engine(canvas, true, null, true);

    BABYLON.SceneManager.LoadScene("/static/assets/", "SecondScene.babylon", engine, function(scene) {


        scene.executeWhenReady(function() {

            // Optimizations
            scene.autoClear = false;
            scene.autoClearDepthAndStencil = false;

            scene.activeCamera.lowerRadiusLimit = 8;
            scene.activeCamera.upperRadiusLimit = 70;
            scene.activeCamera.wheelPrecision = 5;
            scene.activeCamera.attachControl(canvas, true);
            scene.activeCamera.checkCollisions = true;
            scene.activeCamera.inertia = 0.9;
            scene.activeCamera.panningInertia = 0.9;


            for (let mesh of scene.meshes) {

                if (mesh.name.startsWith("cell")) {

                    let n = mesh.name.slice(4);
                    cells.push({ n, mesh });
                    let groundTexture = new BABYLON.DynamicTexture("t_" + mesh.name, 128, scene);

                    let dynamicMaterial = new BABYLON.StandardMaterial("m_" + mesh.name, scene);
                    dynamicMaterial.diffuseTexture = groundTexture;
                    dynamicMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
                    
                    mesh.material = dynamicMaterial;

                    let x, y = 90;
                    if (n < 10) {

                        x = 40;

                    } else {

                        x = 20;

                    }
                    groundTexture.drawText(n, x, y, "bold 80px Segoe UI", "black", "#CCCCCC");

                } else {

                    mesh.checkCollisions = true;

                }
                mesh.freezeWorldMatrix();

            }

            cells.sort((a, b) => parseInt(a.n) - parseInt(b.n));

            BABYLON.SceneLoader.ImportMesh("", "static/assets/ghost/", "ghost.babylon", scene, function(ms) {

                let ghost = ms[0];
                console.log(ghost.skeleton);
                ghost.visibility = 0;
                ghost.scaling = new BABYLON.Vector3(0.03, 0.03, 0.03);

                for (let player of players) {

                    let playerMesh = ghost.clone("m_" + player.name);
                    playerMesh.skeleton = ghost.skeleton.clone("s_" + player.name);
                    playerMesh.position = getRandomPosition(cells[player.initPos - 1].mesh.position);
                    playerMesh.rotation = getRandomRotation();
                    playerMesh.visibility = 1;
                    playerMesh.checkCollisions = false;
                    let idleAnim = scene.beginWeightedAnimation(playerMesh.skeleton, 90, 171, 1.0, true);
                    let walkAnim = scene.beginWeightedAnimation(playerMesh.skeleton, 310, 339, 0.0, true);

                    player.ghost = new Ghost(player.initPos, playerMesh, idleAnim, walkAnim);

                    delete player.initPos;

                    let planeTexture = new BABYLON.DynamicTexture("lt_" + player.name, {height: 32, width: 128}, scene, true);
                    planeTexture.hasAlpha = true;
                    textureContext = planeTexture.getContext();
                    textureContext.font = "bold 32px Segoe UI";
                    let size = planeTexture.getSize();
                    textureContext.save();
                    let textSize = textureContext.measureText(player.name);
                    textureContext.fillStyle = "black";
                    textureContext.fillText(player.name, (size.width - textSize.width) / 2, (size.height + 20) / 2);
                    textureContext.restore();
                    planeTexture.update();

                    let planeMaterial = new BABYLON.StandardMaterial("lm_" + player.name, scene);
                    planeMaterial.backFaceCulling = true;
                    planeMaterial.disableLighting = true;
                    planeMaterial.diffuseTexture = planeTexture;

                    let plane = BABYLON.MeshBuilder.CreatePlane("lp_" + player.name, {width: 128, height: 32}, scene);
                    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
                    plane.material = planeMaterial;
                    plane.parent = playerMesh;
                    plane.position = new BABYLON.Vector3(0, 30, 100);
                    v = plane.position;
                    plane.scaling = ghost.scaling;
                    
                    
                    if (player.name == username) {

                        localGhost = player.ghost;
                        player.ghost.FPS = FPS_FOR_OWNER;

                    }

                }
                
                scene.activeCamera.target = localGhost.mesh;
                scene.activeCamera.useBouncingBehavior = true;

                //scene.createOrUpdateSelectionOctree();

                for (let mat of scene.materials) {

                    mat.freeze();

                }
                scene.blockMaterialDirtyMechanism = true;

                // let opti = BABYLON.SceneOptimizer.OptimizeAsync(scene);
                // opti.onSuccessObservable.add(function() {
                    
                //     console.log("State: Done");

                // });
                // opti.onNewOptimizationAppliedObservable.add(function(optim) {

                //     console.log(optim.getDescription());

                // });
                // opti.onFailureObservable.add(function() {

                //     console.log("State: Failed. Frame rate was " + opti.currentFrameRate);
                
                // });

                if (onGameRendered) {

                    onGameRendered();

                }

            });

            engine.runRenderLoop(function() {

                scene.render();
                for (let player of players) {

                    if (player.ghost) {

                        if (player.ghost.isGoing()) {

                            player.ghost.deltaTime += engine.getDeltaTime();
                            if (player.ghost.deltaTime > 1000 / player.ghost.FPS) {

                                let moveWithValidThis = player.ghost.move.bind(player.ghost);
                                setTimeout(moveWithValidThis, 1, [player.ghost.deltaTime]);
                                player.ghost.deltaTime = 0;

                            }

                        }

                    }

                }

            });

        });

    });

    window.addEventListener("resize", function() {

        engine.resize();

    });
    
}