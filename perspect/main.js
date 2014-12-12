var threed = document.getElementById("threed");
threedHoverHandler = setClassFromMousePos.bind(threed);
threed.addEventListener("mousemove", threedHoverHandler);
threed.addEventListener("mouseout", setClass.bind(threed, ''));

function setClass(className) {
    this.className = className;
}

function setClassFromMousePos(e) {
    var rect = this.getBoundingClientRect()
    var x = e.pageX - rect.left,
        y = e.pageY - rect.top;
    var loc = locatePoint(rect, x, y);
    setClass.call(this, 'tilt-' + loc);
}

function locatePoint(rect, x, y) {
    var col = 1;
    var dw = rect.width / 3;
    if (x < dw) {
        col = 0;
    } else if (x > 2*dw) {
        col = 2;
    }
    var row = 1;
    var dh = rect.height / 3;
    if (y < dh) {
        row = 0;
    } else if (y > 2*dh) {
        row = 2;
    }
    return row*3 + col;
}
