window.onload = function () {
  var els = [document.getElementById("threed")];
  // var els = threed.getElementsByTagName('a');
  [].forEach.call(els, function (el) {
    var pl = new PointLocator(el.parentNode.getBoundingClientRect())
    el.addEventListener('mousemove', setClassFromMousePos.bind(el, pl));
    el.addEventListener('mouseout', setClass.bind(el, 'tilt'));
  });

  function setClass(className) {
    this.setAttribute('class', className);
  }

  function setClassFromMousePos(pointLocator, e) {
    var x = e.pageX - pointLocator.rect.left,
        y = e.pageY - pointLocator.rect.top;
    var loc = pointLocator.track(x, y);
    setClass.call(this, 'tilt tilt-' + loc);
  }

  function PointLocator(rect, order) {
    order || (order = 3);
    this.rect = rect;
    this.order = order;
    this.dw = rect.width / order;
    this.dh = rect.height / order;
  }
  PointLocator.prototype.track = function (x, y) {
      var col = Math.floor(x / this.dw),
          row = Math.floor(y / this.dh);
      return row * this.order + col;
  }
}
