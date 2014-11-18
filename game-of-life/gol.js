function World(cellCount, proximity, age) {
	// populate the cell list with dead cells
	var cells = new Uint8ClampedArray(cellCount);
	// connectivity map: keys are cell indexes and
	// values are adjacent cells indexes.
	var connections = {};

	var i, ii;
	// build the connectivity map, using the provided
	// proximity function.
	for (i=0, ii=cells.length; i<ii; i++) {
		connections[i] = proximity(i);
	}
	// next generation of cells
	this.fcells = new Uint8ClampedArray(cells);
	this.cells = cells;
	this.connections = connections;
	this.proximity = proximity;
	this.age = age;
}
World.prototype.tick = function () {
	var cells = this.cells,
		fcells = this.fcells,
		connections = this.connections;
	var get = function (i) {
		return cells[i];
	};
	for (var i=0, ii=cells.length; i<ii; i++) {
		fcells[i] = this.age(cells[i], connections[i].map(get));
	}
	this.cells = fcells;
	this.fcells = cells;
	this.trigger('tick', { 'cells': fcells });
};
_.extend(World.prototype, Backbone.Events);

function BinaryEvolution() {}
BinaryEvolution.prototype.age = function (cell, neighbors) {
	var alive = neighbors.filter(function (n) { return Boolean(n); });
	if (alive.length === 2 && cell) return 1;
	if (alive.length === 3) return 1;
	return 0;
};
BinaryEvolution.prototype.mutate = function (cell) {
	return !cell;
};

function RectGeom(grid, rows, cols) {
	this.grid = grid;
	this.rows = rows;
	this.cols = cols;
	var w = grid.width / cols;
	var h = grid.height / rows;
	for (i=0; i<rows; i++) {
		for (j=0; j<cols; j++) {
			r = this.polygon(w);
			r.translation.set((j+0.5)*w, (i+0.5)*h);
			r.fill = 'black';
			r.noStroke();
		}
	}
}
RectGeom.prototype.polygon = function (size) {
	return two.makeRectangle(0, 0, size, size);
};
RectGeom.prototype.torus = function (i, j) {
	return ((i+this.cols) % this.cols) * this.cols + ((j+this.rows) % this.rows);
};
RectGeom.prototype.proximity = function (cell) {
	var i, j, k, l, neighbors;
	i = Math.floor(cell / this.rows);
	j = cell % this.cols;
	neighbors = [];
	for (k=-1; k<=1; k++) {
		neighbors.push(this.torus(i-1, j+k));
	}
	neighbors.push(this.torus(i, j-1));
	neighbors.push(this.torus(i, j+1));
	for (k=-1; k<=1; k++) {
		neighbors.push(this.torus(i+1, j+k));
	}
	return neighbors.sort();
};
RectGeom.prototype.update = function (cells, from, to) {
	if (typeof from == 'undefined') from = 0;
	if (typeof to == 'undefined') to = cells.length;
	for (var i=from; i<to; i++) {
		this.grid.scene.children[i+1].fill = cells[i] ? '#000' : '#FFF';
	}
	this.grid.update();
};

function HexGeom(grid, rows, cols) {
	this.grid = grid;
	this.rows = rows;
	this.cols = cols;
	var w = grid.width / (cols+1) / Math.sqrt(3);
	var h = grid.height / rows;
	for (i=0; i<rows; i++) {
		for (j=0; j<cols; j++) {
			r = this.polygon(w);
			r.translation.set(((j+0.5)+(i%2)*0.5)*(Math.sqrt(3)*w), i*(3/4*w*2)+w);
			r.fill = 'black';
			r.noStroke();
		}
	}
}
HexGeom.prototype.polygon = function (radius) {
	var angle, hex = [];
	for (var i=0; i<6; i++) {
		angle = 2 * Math.PI / 6 * (i+0.5);
		hex.push(radius * Math.cos(angle), radius * Math.sin(angle));
	}
	return two.makePolygon.apply(two, hex);
};
HexGeom.prototype.torus = function (i, j) {
	return ((i+this.cols) % this.cols) * this.cols + ((j+this.rows) % this.rows);
};
HexGeom.prototype.proximity = function (cell) {
	var i, j, neighbors;
	i = Math.floor(cell / this.rows);
	j = cell % this.cols;
	neighbors = [];
	neighbors.push(
		this.torus(i-1, j-1 + (i&1)),
		this.torus(i-1, j + (i&1)),
		this.torus(i, j-1),
		this.torus(i, j+1),
		this.torus(i+1, j-1 + (i&1)),
		this.torus(i+1, j + (i&1))
	);
	return neighbors.sort(function (a, b) { return a - b; });
};
HexGeom.prototype.update = function (cells, from, to) {
	if (typeof from == 'undefined') from = 0;
	if (typeof to == 'undefined') to = cells.length;
	for (var i=from; i<to; i++) {
		this.grid.scene.children[i+1].fill = cells[i] ? '#000' : '#FFF';
	}
	this.grid.update();
};
// function Topology(geometry) {
// 	this.geometry = geometry;
// }
// Topology.prototype.proximity = function (cell) {
// 	return this.geometry.proximity(cell);
// }
// Topology.prototype.update = function (cells, from, to) {
// 	return this.geometry.update(cells, from, to);
// }
function Game(two, rows, cols, geometry, time) {
	this.two = two;
	var width = two.width;
	var height = two.height;

	var geom = new geometry(two, rows, cols);
	var t = new time();
	var world = new World(rows*cols, _.bind(geom.proximity, geom), _.bind(t.age, t));
	this.speed = 500;
	this.timer = null;

	world.on('tick', function (e) {
		geom.update(e.cells);
	});
	two.renderer.domElement.addEventListener('click', _.bind(this.handleCellClick, this));
	// two.renderer.domElement.addEventListener('click', function(e) {
	// 	if (e.target.id) {
	// 		var cell = e.target.id.split('-').pop() - 1;
	// 		world.cells[cell] = t.mutate(world.cells[cell]);
	// 		geom.update(world.cells, cell, cell+1);
	// 	}
	// });
	two.renderer.domElement.addEventListener('mouseover', _.bind(this.handleCellHover, this));
	// two.renderer.domElement.addEventListener('mouseover', function(e) {
	// 	if (e.target.id) {
	// 		var cell = e.target.id.split('-').pop() - 1;
	// 		two.scene.noStroke();
	// 		geom.proximity(cell).forEach(function (i) {
	// 			two.scene.children[i+1].stroke = '#FD4';
	// 		});
	// 		two.update();
	// 	}
	// });
	geom.update(world.cells);

	this.geom = geom;
	this.time = t;
	this.world = world;
}
Game.prototype.handleCellClick = function (e) {
	if (e.target.id) {
		var cell = e.target.id.split('-').pop() - 1;
		this.world.cells[cell] = this.time.mutate(this.world.cells[cell]);
		this.geom.update(this.world.cells, cell, cell+1);
	}
};
Game.prototype.handleCellHover = function (e) {
	if (e.target.id) {
		var geom = this.geom;
		var cell = e.target.id.split('-').pop() - 1;
		geom.grid.scene.noStroke();
		geom.proximity(cell).forEach(function (i) {
			geom.grid.scene.children[i+1].stroke = '#FD4';
		});
		geom.grid.update();
	}
};
Game.prototype.start = function () {
	var world = this.world;
	this.timer = setInterval(function() {
		world.tick();
	}, this.speed);
};
Game.prototype.pause = function () {
	clearInterval(this.timer);
	this.timer = null;
};
