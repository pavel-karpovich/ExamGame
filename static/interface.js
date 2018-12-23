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
    let thisMoveAt = moveAt.bind(this);
    document.addEventListener("mousemove", thisMoveAt);

    this.onmouseup = () => {

        document.removeEventListener("mousemove", thisMoveAt);
        this.onmouseup = null;

    };

}

let frames = document.querySelectorAll(".window > .window-frame");
for (let frame of frames) {

    frame.ondragstart = preventStandardDrag;
    frame.onmousedown = startCustomDrag;

}


let savedPickerPos = {
    "color": null,
    "paint": { "x": 853, "y": 172 }
};
let canvasBuffer = null;
const picker = document.getElementById("picker");
let initScale, initRadius, initStrokeWidth;
let isPicking = false;
const fatSvg = document.getElementById("fat_svg");

const initBrushSize = 12;
const stroke = document.getElementById("stroke");
const stroke_text = document.querySelector("#stroke > text");
const strokePath = document.querySelector(".cls-3");

function getPointOnSvg(clientX, clientY){

    let svgPoint = fatSvg.createSVGPoint();
    svgPoint.x = clientX;
    svgPoint.y = clientY;
    return svgPoint.matrixTransform(fatSvg.getScreenCTM().inverse());

}

function updatePicker(posX, posY, color) {

    picker.setAttribute("cx", posX);
    picker.setAttribute("cy", posY)
    picker.style.fill = color;

}

function extractColorFromSvgPoint(svgX, svgY) {
    
    let pixelInfo = canvasBuffer.getContext("2d").getImageData(svgX, svgY, 1, 1).data;
    let color = `rgba(${pixelInfo[0]}, ${pixelInfo[1]}, ${pixelInfo[2]}, ${pixelInfo[3]})`;
    return color;

}

function pickColor(svgX, svgY) {

    let color = extractColorFromSvgPoint(svgX, svgY);
    updatePicker(svgX, svgY, color);
    switch (getEditorMode()) {
        
    case "color":
        updateCustomColor(color);
        break;
    case "paint":
        setBrushColor(color);
    }
}

let colorHorns = document.querySelector("g.cls-2");
colorHorns.addEventListener("mousedown", function(e) {

    isPicking = true;
    picker.style.pointerEvents = "none";
    this.style.cursor = "pointer";
    let svgPoint = getPointOnSvg(e.clientX, e.clientY);
    pickColor(svgPoint.x, svgPoint.y);
    e.stopPropagation();

    this.onmousemove = function(e) {

        let svgPoint = getPointOnSvg(e.clientX, e.clientY);
        pickColor(svgPoint.x, svgPoint.y);
        e.stopPropagation();
    
    }

    let onMouseUp = function(e) {

        isPicking = false;
        colorHorns.onmousemove = null;
        document.removeEventListener("mouseup", onMouseUp);
        picker.style.pointerEvents = "auto";
        colorHorns.style.cursor = "crosshair";
        e.stopPropagation();
    
    }

    document.addEventListener("mouseup", onMouseUp);

});

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
    colorHorns.style.cursor = "pointer";
    let dummyClick = new MouseEvent("mousedown", {
        "view": e.view,
        "bubbles": true,
        "cancelable": false,
        "screenX": e.screenX,
        "screenY": e.screenY,
        "clientX": e.clientX,
        "clientY": e.clientY,
        "offsetX": e.offsetX,
        "offsetY": e.offsetY
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

});

let straightWidth = null;
let arcLength = null;
let leftPoint = null;
const MaxBrushSize = 60;
function initStrokeVars() {

    straightWidth = strokePath.getBBox().width;
    arcLength = strokePath.getTotalLength();
    leftPoint = strokePath.getPointAtLength(0);

}
function updateStrokeByWidth(newSize) {

    if (newSize >= 1 && newSize <= MaxBrushSize) {

        // Equasion: 62x^2 - 3x + 1 == newSize;
        let D = 9 - 248 * (1 - newSize);
        let x1 = (3 + (newSize == 1 ? -Math.sqrt(D) : Math.sqrt(D))) / (2 * 62);
        let realLength = arcLength * x1;
        let point = strokePath.getPointAtLength(realLength);
        stroke.setAttribute("transform", `translate(${point.x - 4.5} ${point.y + 34.5})`);
        setBrushSize(newSize);
        let newText = Math.ceil(1.65 * newSize).toString();
        stroke_text.innerHTML = newText;
        stroke_text.setAttribute("x", newText.length == 1 ? -5.5 : -11);
    }
}

function updateStrokeWidthByXPos(clientX) {

    let svgCoords = getPointOnSvg(clientX, 0);
    let posRelStrokeBox = svgCoords.x - leftPoint.x;
    if (posRelStrokeBox <= 0) {

        updateStrokeByWidth(1);

    } else if (posRelStrokeBox >= straightWidth) {

        updateStrokeByWidth(MaxBrushSize);
    }
    else {

        let realLength = arcLength * posRelStrokeBox / straightWidth;
        let x = realLength / arcLength;
        // Equasion: 62x^2 - 3x + 1; where D(y) = [0;1] and E(y) = [1;60]
        let f_x = 62 * (x ** 2) - 3 * x + 1;
        let point = strokePath.getPointAtLength(realLength);
        stroke.setAttribute("transform", `translate(${point.x - 4.5} ${point.y + 34.5})`);
        setBrushSize(f_x);
        let newText = Math.ceil(1.65 * f_x).toString();
        stroke_text.innerHTML = newText;
        stroke_text.setAttribute("x", newText.length == 1 ? -5.5 : -11);
    }

}

let strokeMoving = false;
let strokeChangeClick = function(e) {

    strokeMoving = true;

    let move = function(e) {

        updateStrokeWidthByXPos(e.clientX);

    }
    move(e);
    document.addEventListener("mousemove", move);

    let onMouseUp = function(e) {

        strokeMoving = false;
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", onMouseUp);
    }
    document.addEventListener("mouseup", onMouseUp);

}

stroke.onmousedown = strokeChangeClick;
strokePath.onmousedown = strokeChangeClick;
 
let selectedImage = null;

function cssSelectImage(image) {

    if (selectedImage) {

        selectedImage.classList.remove("selected-image-box");

    }
    selectedImage = image;
    selectedImage.classList.add("selected-image-box");

}

function addCustomImage(imageUrl) {

    let box = document.createElement("div");
    box.classList.add("image-box");
    box.classList.add("noselect");
    let img = new Image();
    img.src = imageUrl;
    img.ondragstart = preventStandardDrag;
    cssSelectImage(img);
    img.addEventListener("click", function() {

        cssSelectImage(this);
        updateCustomTexture(this);

    });
    img.onload = function() {
        
        updateCustomTexture(this);

    }
    box.appendChild(img);
    imageList.insertBefore(box, addRef);

}

document.addEventListener("onenterlobby", () => {

    let image = document.getElementById("colors");
    canvasBuffer = document.createElement("canvas");
    canvasBuffer.width = 1107;
    canvasBuffer.height = 1107;

    onPreviewSceneLoad = () => {

        let ctx = canvasBuffer.getContext("2d");
        ctx.drawImage(image, 20.5, 133.5, 1067, 948);
        let reallyRandomPosition = { "x": 237, "y": 186 };
        pickColor(reallyRandomPosition.x, reallyRandomPosition.y);
        addCustomImage("data:img/png;base64,iVBORw0KGgoAAAANSUhEUgAABAAAAAQAAQAAAABXZhYuAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAHdElNRQfiDAgBIQVqK16cAAACGUlEQVR42u3OIQEAAAACIP+f1hkWWEB6FgEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAYF3YIvvHeNWBhB3AAAAAElFTkSuQmCC");        

    };
    initScale = picker.getCTM().a;
    initRadius = picker.r.baseVal.value;

    initStrokeWidth = picker.style.strokeWidth;
    initStrokeVars();
    updateStrokeByWidth(initBrushSize);

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

        addCustomImage(e.target.result);

    };
    fileReader.readAsDataURL(this.files[0]);

}, false);

let strokeWidthGroup = document.getElementById("hl2");
let modeSwitch = document.querySelector(".switch > input[type='checkbox']");
modeSwitch.addEventListener("change", function() {

    if (this.matches(':checked') && getEditorMode() == "color") {

        savedPickerPos.color = { "x": picker.cx.baseVal.value, "y": picker.cy.baseVal.value };
        setPaintingMode();
        pickColor(savedPickerPos.paint.x, savedPickerPos.paint.y);
        strokeWidthGroup.style.display = "block";
        strokeWidthGroup.style.transition = "opacity 1s ease-in-out";
        strokeWidthGroup.style.opacity = 1;

    } else if (getEditorMode() == "paint") {

        savedPickerPos.paint = { "x": picker.cx.baseVal.value, "y": picker.cy.baseVal.value }
        setColoringMode();
        pickColor(savedPickerPos.color.x, savedPickerPos.color.y);
        strokeWidthGroup.style.transition = "";
        strokeWidthGroup.style.opacity = 0;
        strokeWidthGroup.style.display = "none"
        
    }
});


let chatInput = document.querySelector(".chat-text");
let chatFeed = document.querySelector(".chat-feed");
let sendButton = document.querySelector(".chat-send");

function recieveMessage(sender, text) {

    let newDiv = document.createElement("div");
    newDiv.classList.add("chat-message");
    let senderSpan = document.createElement("span");
    senderSpan.innerText = sender;
    newDiv.appendChild(senderSpan);
    newDiv.append(text);
    chatFeed.appendChild(newDiv);
    console.log(newDiv);    
}

function sendMessage() {

    let text = chatInput.innerHTML;
    socket.emit("message", {
        "text": text
    });
    chatInput.innerHTML = "";

}

sendButton.addEventListener("click", function(e) {

    if (chatInput.innerHTML != "") {

        sendMessage();

    }

});

let ctrlEnter = false;
chatInput.addEventListener("keydown", function(e) {

    if (e.keyCode == 13 && e.ctrlKey) {

        console.log("Ctrl + Enter");
        ctrlEnter = true;
        let simulatedEnterDown = new KeyboardEvent("keydown", {
            "charCode": e.charCode,
            "bubbles": true,
            "cancelable": true,
            "composed": true,
            "isTrusted": true,
            "code": e.code,
            "key": e.key,
            "keyCode": e.keyCode,
            "location": e.location,
            "which": e.which,
            "sourceCapabilities": e.sourceCapabilities,
            "view": e.view
        });
        let simulatedEnterPress = new KeyboardEvent("keypress", {
            "charCode": e.charCode,
            "bubbles": true,
            "cancelable": true,
            "composed": true,
            "isTrusted": true,
            "code": e.code,
            "key": e.key,
            "keyCode": e.keyCode,
            "location": e.location,
            "which": e.which,
            "sourceCapabilities": e.sourceCapabilities,
            "view": e.view
        });
        let simulatedEnterUp = new KeyboardEvent("keyup", {
            "charCode": e.charCode,
            "bubbles": true,
            "cancelable": true,
            "composed": true,
            "isTrusted": true,
            "code": e.code,
            "key": e.key,
            "keyCode": e.keyCode,
            "location": e.location,
            "which": e.which,
            "sourceCapabilities": e.sourceCapabilities,
            "view": e.view
        });
        this.dispatchEvent(simulatedEnterDown);
        this.dispatchEvent(simulatedEnterPress);
        this.dispatchEvent(simulatedEnterUp);
        
    } else if (e.keyCode == 13) {

        if (!ctrlEnter) {
        
            console.log("Just enter down");
            console.log(e);
            //e.preventDefault();

        } else {

            console.log("Fake enter down");
            console.log(e);
            ctrlEnter = false;
            sendMessage();

        }

    }

});
chatInput.addEventListener("keypress", function(e) {

    if (e.keyCode == 13 && !e.ctrlKey) {

        console.log("Enter press");

    }
})
chatInput.addEventListener("keyup", function(e) {

    if (e.keyCode == 13 && !e.ctrlKey) {

        console.log("Enter up");

    }
})