
let onGameRendered = null;
let players = [];
let localGhost = null;

const FPS_FOR_OWNER = 40;
const FPS_FOR_NET = 20;


function renderGame() {


    let canvas = document.getElementById("scene");
    let engine = new BABYLON.Engine(canvas, true);
    let scene = new BABYLON.Scene(engine);

    BABYLON.SceneLoader.Append("/static/assets/", "SecondScene.babylon", scene);

    scene.executeWhenReady(function() {

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

        }

        cells.sort((a, b) => parseInt(a.n) - parseInt(b.n));

        BABYLON.SceneLoader.ImportMesh("", "static/assets/ghost/", "ghost.babylon", scene, function(ms) {

            let ghost = ms[0];
            ghost.visibility = 0;
            ghost.scaling = new BABYLON.Vector3(0.03, 0.03, 0.03);
            Ghost.origin = ghost;

            for (let player of players) {

                player.ghost = new Ghost(player.name, player.initPos);
                delete player.initPos;
                if (player.name == username) {

                    localGhost = player.ghost;
                    player.ghost.FPS = FPS_FOR_OWNER;

                }

            }
            
            scene.activeCamera.target = localGhost.mesh;
            scene.activeCamera.useBouncingBehavior = true;


            
            //scene.createOrUpdateSelectionOctree();

            if (onGameRendered) {

                onGameRendered();

            }

        });

        engine.runRenderLoop(function() {

            scene.render();
            let deltaTime = engine.getDeltaTime();
            for (let player of players) {

                if (player.ghost) {

                    if (player.ghost.isGoing()) {

                        player.ghost.deltaTime += deltaTime;
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

    window.addEventListener("resize", function() {

        engine.resize();

    });

    // // here the doc for Load function: http://doc.babylonjs.com/api/classes/babylon.sceneloader#load
    // BABYLON.SceneLoader.Load("", "static/assets/babylonJS_logo_v3.babylon", engine, function(scene) {

    //     //as this .babylon example hasn't camera in it, we have to create one
    //     let camera = new BABYLON.ArcRotateCamera("Camera", 1, 1, 4, BABYLON.Vector3.Zero(), scene);
    //     camera.attachControl(canvas, false);

    //     scene.clearColor = new BABYLON.Color3(1, 1, 1);
    //     scene.ambientColor = new BABYLON.Color3.White;

    //     engine.runRenderLoop(function() {

    //         scene.render();

    //     });

    //     window.addEventListener("resize", function() {

    //         engine.resize();

    //     });

    // });

}