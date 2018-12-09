"use strict"

let previewMesh = null;
let customMaterial = null;
let maskImage = null;

const textureSize = 1024;

let onPreviewSceneLoad = null;

function startAnimation() {

    previewMesh.beginAnimation("idle", true);

}

function stopAnimation() {

    previewMesh.getScene().stopAnimation(previewMesh);
}

function renderPreview() {

    let canvas = document.querySelector(".player-preview canvas");
    let engine = new BABYLON.Engine(canvas, true, null, true);
    let scene = new BABYLON.Scene(engine);

    let layer = new BABYLON.Layer("", "static/images/back1.jpg", scene, true);
    let camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 3, 18, new BABYLON.Vector3(0, 0, 0), scene);
    camera.lowerRadiusLimit = camera.upperRadiusLimit = camera.radius;
    camera.attachControl(canvas, true);

    let light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    BABYLON.SceneLoader.ImportMesh("", "static/assets/ghost/", "ghost.babylon", scene, function(ms) {
        
        previewMesh = ms[0];
        previewMesh.position = new BABYLON.Vector3.Zero;
        previewMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);

        startAnimation();
        let dynamicTexture = new BABYLON.DynamicTexture("preview_texture", 1024, scene);
        maskImage = new Image();
        maskImage.src = "static/assets/ghost/ghost_texture.png";
        maskImage.onload = function() {

            let ctx = dynamicTexture.getContext();
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, textureSize, textureSize);
            ctx.drawImage(this, 0, 0);
            dynamicTexture.update();

            if (onPreviewSceneLoad) {
                
                onPreviewSceneLoad();
    
            }

        }
        customMaterial = new BABYLON.StandardMaterial("custom_material", scene);
        customMaterial.backFaceCulling = false;
        customMaterial.diffuseTexture = dynamicTexture;
        previewMesh.material = customMaterial;
        

        // let customTexture = new BABYLON.DynamicTexture("customTexture", 1024, scene);
        // let ctx = customTexture.getContext();
        // let img = new Image();
        // img.src = previewMesh.material.diffuseTexture.url;
        // img.onload = function() {

        //     ctx.drawImage(this, 0, 0);
        //     customTexture.update();

        // }
        // customMaterial = new BABYLON.StandardMaterial("customMaterial", scene);
        // customMaterial.diffuseTexture = customTexture;

        // previewMesh.material = customMaterial;

        camera.setTarget(previewMesh.position.add(new BABYLON.Vector3(0, 4.4, 0)));
        engine.resize();
        

    });

    
    engine.runRenderLoop(function() {

        scene.render();

    });
    window.addEventListener("resize", function() {

        engine.resize();

    });

}

function BabylonColorFromCssColor(cssColor) {

    if (cssColor.startsWith("#")) {

        return BABYLON.Color3.FromHexString(cssColor);

    } else {

        let channels = cssColor.match(/\d+/g);
        channels = channels.map((val) => parseInt(val) / 255);
        return new BABYLON.Color3(channels[0], channels[1], channels[2]);

    }

}

function updateCustomColor(color) {

    //emissiveColor
    //specularColor
    customMaterial.diffuseColor = BabylonColorFromCssColor(color);

}

function updateCustomTexture(image) {

    let ctx = customMaterial.diffuseTexture.getContext();
    //ctx.fillStyle = "transparent";
    //ctx.fillRect(0, 0, textureSize, textureSize);
    ctx.drawImage(image, 0, 0, textureSize, textureSize);
    ctx.drawImage(maskImage, 0, 0, textureSize, textureSize);
    customMaterial.diffuseTexture.update();
}
