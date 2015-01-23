window.onload = function () {
var threed = document.getElementById("threed");
threedHoverHandler = setClassFromMousePos.bind(threed);
threed.addEventListener("mousemove", threedHoverHandler);
threed.addEventListener("mouseout", setClass.bind(threed, 'tilt'));

function setClass(className) {
    this.className = className;
}

var rect = threed.parentNode.getBoundingClientRect()
var pointLocator = mkPointLocator(rect);

function setClassFromMousePos(e) {
    var x = e.pageX - rect.left,
        y = e.pageY - rect.top;
    var loc = pointLocator(x, y);
    setClass.call(this, 'tilt tilt-' + loc);
}

function mkPointLocator(rect) {
    var order = 3;
    var dw = rect.width / order,
        dh = rect.height / order;

    return function (x, y) {
        var col = Math.floor(x / dw),
            row = Math.floor(y / dh);
        return row * order + col;
    }
}}
