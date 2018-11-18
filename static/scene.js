"use strict";

let onGameRendered = null;

function renderGame() {


    let canvas = document.getElementById("scene");
    let engine = new BABYLON.Engine(canvas, true);

    let scene = new BABYLON.Scene(engine);

    // let light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // light.intensity = 0.7;

    // let ground = BABYLON.Mesh.CreateGround("ground1", 10, 10, 2, scene);

    // let myBox = BABYLON.MeshBuilder.CreateBox("myBox", {height: 5, width: 2}, scene);

    // let camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, myBox, scene);

    // scene.collisionsEnabled = true;
    //camera.checkCollisions = true;

    //camera.setPosition(new BABYLON.Vector3(0, 0, 20));

    //camera.attachControl(canvas, true);

    BABYLON.SceneLoader.Append("/static/assets/", "SecondScene.babylon", scene);
    
    
    
    
    scene.executeWhenReady(function() {

        console.log(scene);
        console.log(scene.meshes.filter((m) => m.instances.length != 0));
        scene.activeCamera = scene.cameras[0];
        scene.cameras[0].attachControl(canvas, true);

        
        BABYLON.SceneLoader.ImportMesh("", "static/assets/ghost/", "ghost.babylon", scene, function(ms) {

            console.log(ms);
            let ghost = ms[0];
            ghost.visibility = 0;
            let skeleton = scene.getSkeletonByName("fantome");
            console.log(skeleton);
            skeleton.beginAnimation("fantome|marcher|Baked frames.001", true);




            if (onGameRendered) {

                onGameRendered();

            }

        });

        engine.runRenderLoop(function() {

            scene.render();
            //myBox.position.x += 0.01;

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