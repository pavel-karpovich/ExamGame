"use strict"

const MAX_USERNAME_LENGTH = 30;

let name_input = document.getElementById("username");
name_input.setAttribute("maxlength", MAX_USERNAME_LENGTH);

function getCoords(elem) {

    let box = elem.getBoundingClientRect();
    return {
        top: box.top + pageYOffset,
        left: box.left + pageXOffset
    };

}

function preventStandardDrag() {

    return false;
    
}

function startCustomDrag(e) {

    let coords = getCoords(this.parentElement);
    let shiftX = e.pageX - coords.left;
    let shiftY = e.pageY - coords.top;

    let moveAt = (e) => {

        this.parentElement.style.left = e.pageX - shiftX + "px";
        this.parentElement.style.top = e.pageY - shiftY + "px";

    }
    moveAt(e);
    document.onmousemove = moveAt.bind(this);

    this.onmouseup = () => {

        document.onmousemove = null;
        this.onmouseup = null;

    };

}

let frames = document.querySelectorAll(".window > .window-frame");
for (let frame of frames) {

    frame.ondragstart = preventStandardDrag;
    frame.onmousedown = startCustomDrag;

}


let savedPositions = {
    "color": null,
    "paint": null
};
let picker = document.getElementById("picker");

let fatSvg = document.getElementById("fat_svg");
let svgPoint = fatSvg.createSVGPoint();
let initScale, initRadius, initStrokeWidth;
let isPicking = false;

function cursorPoint(evt){

    svgPoint.x = evt.clientX;
    svgPoint.y = evt.clientY;
    return svgPoint.matrixTransform(fatSvg.getScreenCTM().inverse());

}

function updateColor(color) {

    picker.style.fill = color;
    updateCustomColor(color);

}

let circles = document.querySelectorAll(".cls-2 > circle");
for (let circle of circles) {

    circle.addEventListener("mouseover", function(e) {

        if (isPicking) {

            let color = window.getComputedStyle(this).fill;
            updateColor(color);

        }
        e.stopPropagation();

    });

    circle.addEventListener("mousedown", function(e) {

        let color = window.getComputedStyle(this).fill;
        updateColor(color);
        
    });
    

}

let circleGroup = document.querySelector("g.cls-2");
circleGroup.ondragstart = preventStandardDrag;

circleGroup.onmousedown = function(e) {

    isPicking = true;
    let moveAt = (e) => {

        let loc = cursorPoint(e);
        picker.setAttribute("cx", loc.x);
        picker.setAttribute("cy", loc.y)
        e.stopPropagation();

    }
    moveAt(e);
    picker.style.pointerEvents = "none";
    this.style.cursor = "pointer";
    this.onmousemove = moveAt;
    document.onmouseup = (e) => {

        isPicking = false;
        this.onmousemove = null;
        document.onmouseup = null;
        picker.style.pointerEvents = "auto";
        this.style.cursor = "crosshair";
        e.stopPropagation();

    };

};

let pickerSelected = false;
const selectedPickerScaleRatio = 1.2;

picker.addEventListener("mouseover", function(e) {

    if (!pickerSelected) {

        pickerSelected = true;
        this.r.baseVal.value *= selectedPickerScaleRatio;
        this.style.strokeWidth *= selectedPickerScaleRatio;
        this.style.stroke = "rgba(160,160,160,220)";

    }

});

picker.addEventListener("mouseleave", function(e) {

    if (!isPicking) {

        pickerSelected = false;
        this.r.baseVal.value *= (1 / selectedPickerScaleRatio);
        this.style.strokeWidth *= (1 / selectedPickerScaleRatio);
        this.style.stroke = "rgb(130,130,130)";

    }

});

picker.addEventListener("mousedown", function(e) {

    this.style.pointerEvents = "none";
    circleGroup.style.cursor = "pointer";
    let dummyClick = new MouseEvent("mousedown", {
        "view": e.view,
        "bubbles": e.bubbles,
        "cancelable": e.cancelable,
        "screenX": e.screenX,
        "screenY": e.screenY,
        "clientX": e.clientX,
        "clientY": e.clientY
    });
    document.elementFromPoint(e.clientX, e.clientY).dispatchEvent(dummyClick);
    e.stopPropagation();

});

let previewCanvas = document.querySelector(".player-preview canvas");

const stupidManuallyObtainedRatio = 0.76;
function fitCanvasSize() {

    let svgStyle = window.getComputedStyle(fatSvg);
    let w = parseInt(svgStyle.width.slice(0, -2));
    let h = parseInt(svgStyle.height.slice(0, -2));
    let minSize = w < h ? w : h;
    previewCanvas.style.width = minSize * stupidManuallyObtainedRatio + "px";
    previewCanvas.style.height = minSize * stupidManuallyObtainedRatio + "px";

}

const bg = document.getElementById("lobby_background");
const lobby = document.querySelector(".lobby-container");
const windowWidth = window.innerWidth / 5;
const windowHeight = window.innerHeight / 5 ;

lobby.ondragstart = preventStandardDrag;
lobby.addEventListener("pointermove", (e) => {

    const mouseX = e.clientX / windowWidth;
    const mouseY = e.clientY / windowHeight;
    bg.style.transform = `translate3d(-${mouseX}%, -${mouseY}%, 0)`;

}, true);

document.addEventListener("onenterlobby", () => {

    let randomCircleNum = Math.floor(Math.random() * 1471) + 3;
    let randomCircle = document.getElementsByClassName("cls-" + randomCircleNum)[0];

    onPreviewSceneLoad = () => {

        updateColor(window.getComputedStyle(randomCircle).fill);
        addCustomImage("data:img/png;base64,iVBORw0KGgoAAAANSUhEUgAABAAAAAQAAQAAAABXZhYuAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAHdElNRQfiDAgBIQVqK16cAAACGUlEQVR42u3OIQEAAAACIP+f1hkWWEB6FgEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAYF3YIvvHeNWBhB3AAAAAElFTkSuQmCC");        

    };
    picker.setAttribute("cx", randomCircle.cx.baseVal.value);
    picker.setAttribute("cy", randomCircle.cy.baseVal.value);
    initScale = picker.getCTM().a;
    initRadius = picker.r.baseVal.value;
    initStrokeWidth = picker.style.strokeWidth;

    fitCanvasSize();

    window.addEventListener("resize", function() {

        let k = initScale / picker.getCTM().a;
        picker.r.baseVal.value = initRadius * k;
        picker.style.strokeWidth = initStrokeWidth * k;
        fitCanvasSize();
        
    });

});

let openFileDialog = () => {

    let fileDialog = document.getElementById("fileDialog");
    fileDialog.click();

};

let selectImageTitle = document.querySelector(".select-image-container");
selectImageTitle.addEventListener("click", openFileDialog);
let selectImageButton = document.querySelector(".add-image");
selectImageButton.addEventListener("click", openFileDialog);


let imageList = document.querySelector(".image-list");
let addRef = document.querySelector(".add-image");

function addCustomImage(imageUrl) {

    let box = document.createElement("div");
    box.classList.add("image-box");
    box.classList.add("noselect");
    let img = new Image();
    img.src = imageUrl;
    img.ondragstart = preventStandardDrag;
    img.addEventListener("click", function() {

        updateCustomTexture(this);

    });
    img.onload = function() {
        
        updateCustomTexture(this);

    }
    box.appendChild(img);
    imageList.insertBefore(box, addRef);

}

let fileDialog = document.getElementById("fileDialog");
let formats = [".jpg", ".jpeg", ".bmp", ".gif", ".png", ".svg", ".webp"];
fileDialog.addEventListener("change", function() {

    if (!this.files || 
        !this.files[0] ||
        !formats.find((format) => this.files[0].name.toLowerCase().endsWith(format))
        ) {

        return;
    }
    let fileReader = new FileReader();
    fileReader.onload = function(e) {

        let img = addCustomImage(e.target.result);

    };
    fileReader.readAsDataURL(this.files[0]);

}, false);

let modeSwitch = document.querySelector(".switch > input[type='checkbox']");
modeSwitch.addEventListener("change", function() {

    if (this.matches(':checked')) {

        savedPositions.color = { "x": picker.cx.baseVal.value, "y": picker.cy.baseVal.value };
        if (savedPositions.paint) {

            picker.setAttribute("cx", savedPositions.paint.x);
            picker.setAttribute("cy", savedPositions.paint.y);

        }
        stopAnimation();

    } else {

        savedPositions.paint = { "x": picker.cx.baseVal.value, "y": picker.cy.baseVal.value }
        if (savedPositions.color) {

            picker.setAttribute("cx", savedPositions.color.x);
            picker.setAttribute("cy", savedPositions.color.y);

        }
        startAnimation();
        
    }
});