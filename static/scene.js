"use strict"

let onGameRendered = null;
let players = [];
let localGhost = null;

const FPS_FOR_OWNER = 40;
const FPS_FOR_NET = 20;
let v;
function getRandomRotation() {

    let rndAngle = Math.random() * 2 * Math.PI;
    return new BABYLON.Vector3(0, rndAngle, 0);

}

function _updatePlayerMeshStyle(playerMesh, playerName, diffuseColor, textureDataUrl) {
    
    playerMesh.material.diffuseTexture = new BABYLON.Texture(textureDataUrl, playerMesh.getScene());
    playerMesh.material.diffuseColor = BABYLON.Color3.FromHexString(diffuseColor);
    
}

function getRandomPosition(initVec) {

    return new BABYLON.Vector3(
        initVec.x + Math.random() * 10 - 5,
        initVec.y + Math.random() * 2,
        initVec.z + Math.random() * 10 - 5
    );

}

let connectPlayer = null;

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

                let ghostMesh = ms[0];
                ghostMesh.visibility = 0;
                ghostMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
                connectPlayer = function(player) {

                    let playerMesh = ghostMesh.clone("m_" + player.name);
                    playerMesh.skeleton = ghostMesh.skeleton.clone("s_" + player.name);
                    playerMesh.material = new BABYLON.StandardMaterial("m_" + player.name, scene);
                    playerMesh.material.backFaceCulling = false;
                    if (player.diffuseColor && player.textureDataUrl) {

                        _updatePlayerMeshStyle(playerMesh, player.name, player.diffuseColor, player.textureDataUrl);

                    }
                    playerMesh.position = getRandomPosition(cells[player.pos - 1].mesh.position);
                    playerMesh.rotation = getRandomRotation();
                    playerMesh.visibility = 1;
                    playerMesh.checkCollisions = false;
                    let idleAnim = scene.beginWeightedAnimation(playerMesh.skeleton, 40, 130, 1.0, true);
                    let walkAnim = scene.beginWeightedAnimation(playerMesh.skeleton, 0, 30, 0.0, true);

                    player.ghost = new Ghost(player.pos, playerMesh, idleAnim, walkAnim);
                    player.ghost.FPS = FPS_FOR_NET;

                    delete player.pos;

                    let planeTexture = new BABYLON.DynamicTexture("lt_" + player.name, {width: 512, height: 64}, scene, true);
                    planeTexture.hasAlpha = true;
                    let textureContext = planeTexture.getContext();
                    textureContext.font = "bold 38px Segoe UI";
                    let size = planeTexture.getSize();
                    textureContext.save();
                    let textSize = textureContext.measureText(player.name);
                    textureContext.fillStyle = "black";
                    textureContext.fillText(player.name, (size.width - textSize.width) / 2, (size.height + 20) / 2);
                    textureContext.restore();
                    planeTexture.update();

                    let planeMaterial = new BABYLON.StandardMaterial("lm_" + player.name, scene);
                    planeMaterial.disableLighting = true;
                    planeMaterial.diffuseTexture = planeTexture;

                    let plane = BABYLON.MeshBuilder.CreatePlane("lp_" + player.name, {width: 512, height: 64}, scene);
                    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
                    plane.material = planeMaterial;
                    plane.parent = playerMesh;
                    plane.position = new BABYLON.Vector3(0, 12, 0);
                    v = plane.position;
                    plane.scaling = new BABYLON.Vector3(0.03, 0.03, 0.03);
                    
                    
                    if (player.name == username) {

                        localGhost = player.ghost;
                        player.ghost.FPS = FPS_FOR_OWNER;

                    }
                }

                for (let player of players) {

                    connectPlayer(player);

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

            });

        });

    });

    window.addEventListener("resize", function() {

        engine.resize();

    });
    
}

function updatePlayerStyleLocally(name, diffuseColor, textureDataUrl) {

    let player = players.find((pl) => pl.name == name);
    if (player) {

        player.diffuseColor = diffuseColor;
        player.textureDataUrl = textureDataUrl;
        if (player.ghost) {

            _updatePlayerMeshStyle(player.ghost.mesh, name, diffuseColor, textureDataUrl);

        }

    }

}