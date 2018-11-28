
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

let leadFrame = document.querySelector(".leaderboard-window > .window-frame");
leadFrame.ondragstart = preventStandardDrag;
leadFrame.onmousedown = startCustomDrag;

let taskFrame = document.querySelector(".task-window > .window-frame");
taskFrame.ondragstart = preventStandardDrag;
taskFrame.onmousedown = startCustomDrag;