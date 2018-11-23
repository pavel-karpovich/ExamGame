let frame = document.querySelector(".lead-frame");

function getCoords(elem) {

    let box = elem.getBoundingClientRect();
    return {
        top: box.top + pageYOffset,
        left: box.left + pageXOffset
    };

}

frame.onmousedown = function(e) {

    let coords = getCoords(frame.parentElement);
    let shiftX = e.pageX - coords.left;
    let shiftY = e.pageY - coords.top;

    function moveAt(e) {

        frame.parentElement.style.left = e.pageX - shiftX + "px";
        frame.parentElement.style.top = e.pageY - shiftY + "px";

    }
    moveAt(e);

    document.onmousemove = function(e) {
        
        moveAt(e);

    };

    frame.onmouseup = function() {

        document.onmousemove = null;
        frame.onmouseup = null;

    };

}

frame.ondragstart = function() {

    return false;

};
