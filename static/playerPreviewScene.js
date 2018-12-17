"use strict"

let previewMesh = null;
let customMaterial = null;
let maskImage = null;
let scene = null;
let camera = null;

const textureSize = 1024;
const canvas = document.querySelector(".player-preview canvas");

let onPreviewSceneLoad = null;

let _editorMode = "color";

let savedCameraPos = {
    "color": null,
    "paint": null
}

function getEditorMode() {

    return _editorMode;

}


let _brushColor = "black";
let _brushSize = 0;

function setBrushColor(newColor) {

    if (typeof(newColor) == "string") {

        _brushColor = newColor;

    }

}

function setBrushSize(newSize) {

    _brushSize = newSize;

}

function midPointBtw(p1, p2) {
    
    return {
        x: p1.x + (p2.x - p1.x) / 2,
        y: p1.y + (p2.y - p1.y) / 2
    };

}

let points = [];

function draw() {

    let pickInfo = scene.pick(scene.pointerX, scene.pointerY);
    let texCoords = pickInfo.getTextureCoordinates();
    

    // if (texCoords) {

    //     let ctx = customMaterial.diffuseTexture.getContext();
    //     let centerX = texCoords.x * textureSize;
    //     let centerY = textureSize - texCoords.y * textureSize;

    //     ctx.beginPath();
    //     ctx.arc(centerX, centerY, _brushSize, 0, 2 * Math.PI, false);
    //     ctx.fillStyle = _brushColor;
    //     ctx.fill();
    //     ctx.lineWidth = 5;
    //     ctx.strokeStyle = _brushColor;
    //     ctx.stroke();

    //     customMaterial.diffuseTexture.update();
    // }
    if (texCoords) {

        let ctx = customMaterial.diffuseTexture.getContext();

        ctx.strokeStyle = _brushColor;
        ctx.lineWidth = _brushSize;
        ctx.lineJoin = ctx.lineCap = 'round';

        let centerX = texCoords.x * textureSize;
        let centerY = textureSize - texCoords.y * textureSize;

        points.push({ x: centerX, y: centerY });

        let p1 = points[0];
        let p2 = points[1];
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);

        for (var i = 1, len = points.length; i < len; i++) {

            var midPoint = midPointBtw(p1, p2);
            ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
            p1 = points[i];
            p2 = points[i+1];

        }
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
        customMaterial.diffuseTexture.update();

    }

}

let anim = null;
function setPaintingMode() {

    savedCameraPos.color.set(camera.position.x, camera.position.y, camera.position.z);
    camera.position.set(savedCameraPos.paint.x, savedCameraPos.paint.y, savedCameraPos.paint.z);
    camera.rebuildAnglesAndRadius();
    if (anim) {
        
        anim.pause();
        anim.goToFrame(100);

    }
    camera.lowerRadiusLimit = 2;
    let isDrawing = false;
    scene.onPointerDown = function(e) {

        if (e.button == 0) {

            camera.detachControl(canvas);
            isDrawing = true;
            draw();

        } else if (e.button == 1) {

            scene.defaultCursor = "pointer";
        
        } else if (e.button == 2) {

            scene.defaultCursor = "move";

        } 
    }
    scene.onPointerMove = function(e) {

        if (isDrawing) {

            draw();

        }
        e.stopPropagation();
    }
    scene.onPointerUp = function(e) {

        if (e.button == 0) {

            camera.attachControl(canvas);
            isDrawing = false;
            points.length = 0;

        }
        scene.defaultCursor = "url('/static/images/brush.png') 0 20, auto";
    }
    scene.defaultCursor = "url('/static/images/brush.png') 0 20, auto";
    _editorMode = "paint";
}

function setColoringMode() {

    savedCameraPos.paint.set(camera.position.x, camera.position.y, camera.position.z);
    camera.position.set(savedCameraPos.color.x, savedCameraPos.color.y, savedCameraPos.color.z);
    camera.rebuildAnglesAndRadius();
    if (!anim) {

        anim = previewMesh.beginAnimation("idle", true);
    
    } else {

        anim.restart();

    }
    camera.radius = camera.upperRadiusLimit;
    camera.lowerRadiusLimit = camera.radius;
    scene.onPointerDown = function(e) {

        if (e.button == 0 || e.button == 1) {

            scene.defaultCursor = "pointer";

        } else if (e.button == 2) {

            scene.defaultCursor = "move";

        }
    }
    scene.onPointerMove = null;
    scene.onPointerUp = function(e) {

        scene.defaultCursor = "";

    }
    scene.defaultCursor = "";
    _editorMode = "color";

}

function renderPreview() {

    let engine = new BABYLON.Engine(canvas, true, null, true);
    scene = new BABYLON.Scene(engine);

    let layer = new BABYLON.Layer("", "static/images/back1.jpg", scene, true);
    camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 3, 18, new BABYLON.Vector3(0, 0, 0), scene);
    camera.lowerRadiusLimit = camera.upperRadiusLimit = camera.radius;
    camera.wheelPrecision = 40;
    camera.attachControl(canvas, true);

    let light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    BABYLON.SceneLoader.ImportMesh("", "static/assets/ghost/", "ghost.babylon", scene, function(ms) {
        
        previewMesh = ms[0];
        previewMesh.updateFacetData();
        previewMesh.position = new BABYLON.Vector3.Zero;
        previewMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
        camera.setTarget(previewMesh.position.add(new BABYLON.Vector3(0, 4.4, 0)));

        savedCameraPos.paint = camera.position.clone();
        savedCameraPos.color = camera.position.clone();
        setColoringMode();

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

    if (typeof(cssColor) === "string" && cssColor.startsWith("#")) {

        return BABYLON.Color3.FromHexString(cssColor);

    } else if (typeof(cssColor) === "string") {

        let channels = cssColor.match(/\d+/g);
        channels = channels.map((val) => parseInt(val) / 255);
        return new BABYLON.Color3(channels[0], channels[1], channels[2]);

    } else {
        
        return BABYLON.Color3.Random();
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
