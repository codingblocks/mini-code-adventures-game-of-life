(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * scripts/main.js
 *
 * This is the starting point for your application.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

var App = require('./app.js');

var app = new App();

app.beep();
},{"./app.js":2}],2:[function(require,module,exports){
/**
 * scripts/app.js
 *
 * This is a sample CommonJS module.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

function App() {
  console.log('app initialized');
}

module.exports = App;

App.prototype.beep = function () {
  console.log('boop');
};

var canvas = document.getElementById('maze');
var pen = canvas.getContext('2d');
pen.fillStyle = '#DDDDDD';

var size = 1;

var maze = require('amazejs');
var m = new maze.Backtracker(canvas.width / size, canvas.height / size);
m.generate();

for(var row = 0; row < m.height; row++) {
  for(var col = 0; col < m.width; col++) {
    if(m.get(row, col)) {
      pen.fillRect(col * size, row * size, size, size);
    }
  }
}
},{"amazejs":3}],3:[function(require,module,exports){
module.exports = require('./lib/maze');

},{"./lib/maze":4}],4:[function(require,module,exports){
'use strict';

var queue = require('priorityjs');

function Backtracker(width, height) {
    this.width = width;
    this.height = height;
    this.grid = new Uint8Array(width * height);
}

Array.prototype.peek = function() {
    return this.length > 0 ? this[this.length - 1] : undefined;
};

Backtracker.prototype.test = function(r, c) {
    return !(r <= 0 || r >= (this.height - 1) ||
            c <= 0 || c >= (this.width - 1)) &&
        !this.grid[r * this.width + c];
};

Backtracker.prototype.get = function(r, c) {
    return this.grid[r * this.width + c];
};

Backtracker.prototype.set = function(r, c, v) {
    this.grid[r * this.width + c] = v;
};

Backtracker.prototype.fringe = function(r, c) {
    var items = [];
    var f = [
        [-2, 0],
        [0, 2],
        [2, 0],
        [0, -2]
    ];
    for (var i = 0; i < f.length; i++) {
        if (this.test(r + f[i][0], c + f[i][1])) {
            items.push([r + f[i][0], c + f[i][1]]);
        }
    }
    return items;
};

Backtracker.prototype.reset = function() {
    var l = this.grid.length;
    while (l) {
        this.grid[--l] = 0;
    }
};

Backtracker.prototype.generate = function() {
    var stack = [];
    var cc = [1, 1];
    while (cc) {
        this.set(cc[0], cc[1], 1);
        var f = this.fringe(cc[0], cc[1]);
        if (f.length > 0) {
            var cf = f[Math.floor(Math.random() * f.length)];
            stack.push(cc);
            this.set(Math.floor((cc[0] + cf[0]) / 2),
                Math.floor((cc[1] + cf[1]) / 2), 1);
            cc = cf;
        } else {
            cc = stack.pop();
        }
    }
};

Backtracker.prototype.solve = function(start, end) {
    var pq = new queue.PriorityQ(function(a, b) {
        return a.score < b.score;
    });
    var visited = new Set();
    var self = this;

    var manhattan = function(a, b) {
        return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    };

    var test = function(r, c) {
        return !(r <= 0 || r >= (self.height - 1) ||
                c <= 0 || c >= (self.width - 1)) &&
            self.grid[r * self.width + c];
    };

    var fringe = function(r, c) {
        var items = [];
        var f = [
            [-1, 0],
            [0, 1],
            [1, 0],
            [0, -1]
        ];
        for (var i = 0; i < f.length; i++) {
            if (test(r + f[i][0], c + f[i][1])) {
                items.push([r + f[i][0], c + f[i][1]]);
            }
        }
        return items;
    };

    var ci = {
        path: [start],
        score: manhattan(start, end)
    };
    visited.add(JSON.stringify(ci.path.peek()));
    while (ci && manhattan(ci.path.peek(), end) !== 0) {
        var fr = fringe(ci.path.peek()[0], ci.path.peek()[1]);
        for (var i = 0; i < fr.length; i++) {
            var frstr = JSON.stringify(fr[i]);
            if (!visited.has(frstr)) {
                visited.add(frstr);
                var np = ci.path.slice(0);
                np.push(fr[i]);
                pq.push({
                    path: np,
                    score: ci.score + manhattan(fr[i], end)
                });
            }
        }
        ci = pq.pop();
    }
    return ci ? ci.path : [];
};

Backtracker.prototype.toString = function() {
    var str = '';
    for (var r = 0; r < this.height; r++) {
        str += '\n';
        for (var c = 0; c < this.width; c++) {
            str += this.grid[r * this.width + c] ? ' ' : '█';
        }
    }
    return str;
};

module.exports.Backtracker = Backtracker;

},{"priorityjs":5}],5:[function(require,module,exports){
module.exports = require('./lib/priorityq');

},{"./lib/priorityq":6}],6:[function(require,module,exports){
	'use strict';

	function PriorityQ(comp) {
	    if (!comp || comp.length != 2) {
	        throw 'a valid comparator function required';
	    }
	    this.comp = comp;
	    this.items = [];
	}

	PriorityQ.prototype.push = function(item) {
	    for (var i = 0; i < this.items.length; i++) {
	        if (this.comp(item, this.items[i])) {
	            this.items.splice(i, 0, item);
	            return;
	        }
	    }
	    this.items[i] = item;
	};

	PriorityQ.prototype.pop = function() {
	    return this.items.shift();
	};

	PriorityQ.prototype.peek = function() {
	    return this.items[0];
	};

	PriorityQ.prototype.size = function() {
	    return this.items.length;
	};

	PriorityQ.prototype.clear = function() {
	    this.items = [];
	};

	PriorityQ.prototype.isEmpty = function() {
	    return this.items.length === 0;
	};

	module.exports.PriorityQ = PriorityQ;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL2FwcC9zY3JpcHRzL21haW4uanMiLCIvVXNlcnMvam9lL09uZURyaXZlL1Byb2plY3RzL21hemUtZ2VuZXJhdG9yL2FwcC9zY3JpcHRzL2FwcC5qcyIsIi9Vc2Vycy9qb2UvT25lRHJpdmUvUHJvamVjdHMvbWF6ZS1nZW5lcmF0b3Ivbm9kZV9tb2R1bGVzL2FtYXplanMvaW5kZXguanMiLCIvVXNlcnMvam9lL09uZURyaXZlL1Byb2plY3RzL21hemUtZ2VuZXJhdG9yL25vZGVfbW9kdWxlcy9hbWF6ZWpzL2xpYi9tYXplLmpzIiwiL1VzZXJzL2pvZS9PbmVEcml2ZS9Qcm9qZWN0cy9tYXplLWdlbmVyYXRvci9ub2RlX21vZHVsZXMvcHJpb3JpdHlqcy9pbmRleC5qcyIsIi9Vc2Vycy9qb2UvT25lRHJpdmUvUHJvamVjdHMvbWF6ZS1nZW5lcmF0b3Ivbm9kZV9tb2R1bGVzL3ByaW9yaXR5anMvbGliL3ByaW9yaXR5cS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFJQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIHNjcmlwdHMvbWFpbi5qc1xuICpcbiAqIFRoaXMgaXMgdGhlIHN0YXJ0aW5nIHBvaW50IGZvciB5b3VyIGFwcGxpY2F0aW9uLlxuICogVGFrZSBhIGxvb2sgYXQgaHR0cDovL2Jyb3dzZXJpZnkub3JnLyBmb3IgbW9yZSBpbmZvXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQXBwID0gcmVxdWlyZSgnLi9hcHAuanMnKTtcblxudmFyIGFwcCA9IG5ldyBBcHAoKTtcblxuYXBwLmJlZXAoKTsiLCIvKipcbiAqIHNjcmlwdHMvYXBwLmpzXG4gKlxuICogVGhpcyBpcyBhIHNhbXBsZSBDb21tb25KUyBtb2R1bGUuXG4gKiBUYWtlIGEgbG9vayBhdCBodHRwOi8vYnJvd3NlcmlmeS5vcmcvIGZvciBtb3JlIGluZm9cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIEFwcCgpIHtcbiAgY29uc29sZS5sb2coJ2FwcCBpbml0aWFsaXplZCcpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcDtcblxuQXBwLnByb3RvdHlwZS5iZWVwID0gZnVuY3Rpb24gKCkge1xuICBjb25zb2xlLmxvZygnYm9vcCcpO1xufTtcblxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXplJyk7XG52YXIgcGVuID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5wZW4uZmlsbFN0eWxlID0gJyNEREREREQnO1xuXG52YXIgc2l6ZSA9IDE7XG5cbnZhciBtYXplID0gcmVxdWlyZSgnYW1hemVqcycpO1xudmFyIG0gPSBuZXcgbWF6ZS5CYWNrdHJhY2tlcihjYW52YXMud2lkdGggLyBzaXplLCBjYW52YXMuaGVpZ2h0IC8gc2l6ZSk7XG5tLmdlbmVyYXRlKCk7XG5cbmZvcih2YXIgcm93ID0gMDsgcm93IDwgbS5oZWlnaHQ7IHJvdysrKSB7XG4gIGZvcih2YXIgY29sID0gMDsgY29sIDwgbS53aWR0aDsgY29sKyspIHtcbiAgICBpZihtLmdldChyb3csIGNvbCkpIHtcbiAgICAgIHBlbi5maWxsUmVjdChjb2wgKiBzaXplLCByb3cgKiBzaXplLCBzaXplLCBzaXplKTtcbiAgICB9XG4gIH1cbn0iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL21hemUnKTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHF1ZXVlID0gcmVxdWlyZSgncHJpb3JpdHlqcycpO1xyXG5cclxuZnVuY3Rpb24gQmFja3RyYWNrZXIod2lkdGgsIGhlaWdodCkge1xyXG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICB0aGlzLmdyaWQgPSBuZXcgVWludDhBcnJheSh3aWR0aCAqIGhlaWdodCk7XHJcbn1cclxuXHJcbkFycmF5LnByb3RvdHlwZS5wZWVrID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5sZW5ndGggPiAwID8gdGhpc1t0aGlzLmxlbmd0aCAtIDFdIDogdW5kZWZpbmVkO1xyXG59O1xyXG5cclxuQmFja3RyYWNrZXIucHJvdG90eXBlLnRlc3QgPSBmdW5jdGlvbihyLCBjKSB7XHJcbiAgICByZXR1cm4gIShyIDw9IDAgfHwgciA+PSAodGhpcy5oZWlnaHQgLSAxKSB8fFxyXG4gICAgICAgICAgICBjIDw9IDAgfHwgYyA+PSAodGhpcy53aWR0aCAtIDEpKSAmJlxyXG4gICAgICAgICF0aGlzLmdyaWRbciAqIHRoaXMud2lkdGggKyBjXTtcclxufTtcclxuXHJcbkJhY2t0cmFja2VyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihyLCBjKSB7XHJcbiAgICByZXR1cm4gdGhpcy5ncmlkW3IgKiB0aGlzLndpZHRoICsgY107XHJcbn07XHJcblxyXG5CYWNrdHJhY2tlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24ociwgYywgdikge1xyXG4gICAgdGhpcy5ncmlkW3IgKiB0aGlzLndpZHRoICsgY10gPSB2O1xyXG59O1xyXG5cclxuQmFja3RyYWNrZXIucHJvdG90eXBlLmZyaW5nZSA9IGZ1bmN0aW9uKHIsIGMpIHtcclxuICAgIHZhciBpdGVtcyA9IFtdO1xyXG4gICAgdmFyIGYgPSBbXHJcbiAgICAgICAgWy0yLCAwXSxcclxuICAgICAgICBbMCwgMl0sXHJcbiAgICAgICAgWzIsIDBdLFxyXG4gICAgICAgIFswLCAtMl1cclxuICAgIF07XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGYubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAodGhpcy50ZXN0KHIgKyBmW2ldWzBdLCBjICsgZltpXVsxXSkpIHtcclxuICAgICAgICAgICAgaXRlbXMucHVzaChbciArIGZbaV1bMF0sIGMgKyBmW2ldWzFdXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGl0ZW1zO1xyXG59O1xyXG5cclxuQmFja3RyYWNrZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgbCA9IHRoaXMuZ3JpZC5sZW5ndGg7XHJcbiAgICB3aGlsZSAobCkge1xyXG4gICAgICAgIHRoaXMuZ3JpZFstLWxdID0gMDtcclxuICAgIH1cclxufTtcclxuXHJcbkJhY2t0cmFja2VyLnByb3RvdHlwZS5nZW5lcmF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHN0YWNrID0gW107XHJcbiAgICB2YXIgY2MgPSBbMSwgMV07XHJcbiAgICB3aGlsZSAoY2MpIHtcclxuICAgICAgICB0aGlzLnNldChjY1swXSwgY2NbMV0sIDEpO1xyXG4gICAgICAgIHZhciBmID0gdGhpcy5mcmluZ2UoY2NbMF0sIGNjWzFdKTtcclxuICAgICAgICBpZiAoZi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciBjZiA9IGZbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZi5sZW5ndGgpXTtcclxuICAgICAgICAgICAgc3RhY2sucHVzaChjYyk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KE1hdGguZmxvb3IoKGNjWzBdICsgY2ZbMF0pIC8gMiksXHJcbiAgICAgICAgICAgICAgICBNYXRoLmZsb29yKChjY1sxXSArIGNmWzFdKSAvIDIpLCAxKTtcclxuICAgICAgICAgICAgY2MgPSBjZjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjYyA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkJhY2t0cmFja2VyLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcclxuICAgIHZhciBwcSA9IG5ldyBxdWV1ZS5Qcmlvcml0eVEoZnVuY3Rpb24oYSwgYikge1xyXG4gICAgICAgIHJldHVybiBhLnNjb3JlIDwgYi5zY29yZTtcclxuICAgIH0pO1xyXG4gICAgdmFyIHZpc2l0ZWQgPSBuZXcgU2V0KCk7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIG1hbmhhdHRhbiA9IGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5hYnMoYVswXSAtIGJbMF0pICsgTWF0aC5hYnMoYVsxXSAtIGJbMV0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgdGVzdCA9IGZ1bmN0aW9uKHIsIGMpIHtcclxuICAgICAgICByZXR1cm4gIShyIDw9IDAgfHwgciA+PSAoc2VsZi5oZWlnaHQgLSAxKSB8fFxyXG4gICAgICAgICAgICAgICAgYyA8PSAwIHx8IGMgPj0gKHNlbGYud2lkdGggLSAxKSkgJiZcclxuICAgICAgICAgICAgc2VsZi5ncmlkW3IgKiBzZWxmLndpZHRoICsgY107XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBmcmluZ2UgPSBmdW5jdGlvbihyLCBjKSB7XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcbiAgICAgICAgdmFyIGYgPSBbXHJcbiAgICAgICAgICAgIFstMSwgMF0sXHJcbiAgICAgICAgICAgIFswLCAxXSxcclxuICAgICAgICAgICAgWzEsIDBdLFxyXG4gICAgICAgICAgICBbMCwgLTFdXHJcbiAgICAgICAgXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGYubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRlc3QociArIGZbaV1bMF0sIGMgKyBmW2ldWzFdKSkge1xyXG4gICAgICAgICAgICAgICAgaXRlbXMucHVzaChbciArIGZbaV1bMF0sIGMgKyBmW2ldWzFdXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgY2kgPSB7XHJcbiAgICAgICAgcGF0aDogW3N0YXJ0XSxcclxuICAgICAgICBzY29yZTogbWFuaGF0dGFuKHN0YXJ0LCBlbmQpXHJcbiAgICB9O1xyXG4gICAgdmlzaXRlZC5hZGQoSlNPTi5zdHJpbmdpZnkoY2kucGF0aC5wZWVrKCkpKTtcclxuICAgIHdoaWxlIChjaSAmJiBtYW5oYXR0YW4oY2kucGF0aC5wZWVrKCksIGVuZCkgIT09IDApIHtcclxuICAgICAgICB2YXIgZnIgPSBmcmluZ2UoY2kucGF0aC5wZWVrKClbMF0sIGNpLnBhdGgucGVlaygpWzFdKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBmcnN0ciA9IEpTT04uc3RyaW5naWZ5KGZyW2ldKTtcclxuICAgICAgICAgICAgaWYgKCF2aXNpdGVkLmhhcyhmcnN0cikpIHtcclxuICAgICAgICAgICAgICAgIHZpc2l0ZWQuYWRkKGZyc3RyKTtcclxuICAgICAgICAgICAgICAgIHZhciBucCA9IGNpLnBhdGguc2xpY2UoMCk7XHJcbiAgICAgICAgICAgICAgICBucC5wdXNoKGZyW2ldKTtcclxuICAgICAgICAgICAgICAgIHBxLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IG5wLFxyXG4gICAgICAgICAgICAgICAgICAgIHNjb3JlOiBjaS5zY29yZSArIG1hbmhhdHRhbihmcltpXSwgZW5kKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY2kgPSBwcS5wb3AoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjaSA/IGNpLnBhdGggOiBbXTtcclxufTtcclxuXHJcbkJhY2t0cmFja2VyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHN0ciA9ICcnO1xyXG4gICAgZm9yICh2YXIgciA9IDA7IHIgPCB0aGlzLmhlaWdodDsgcisrKSB7XHJcbiAgICAgICAgc3RyICs9ICdcXG4nO1xyXG4gICAgICAgIGZvciAodmFyIGMgPSAwOyBjIDwgdGhpcy53aWR0aDsgYysrKSB7XHJcbiAgICAgICAgICAgIHN0ciArPSB0aGlzLmdyaWRbciAqIHRoaXMud2lkdGggKyBjXSA/ICcgJyA6ICfilognO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBzdHI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cy5CYWNrdHJhY2tlciA9IEJhY2t0cmFja2VyO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL3ByaW9yaXR5cScpO1xyXG4iLCJcdCd1c2Ugc3RyaWN0JztcclxuXHJcblx0ZnVuY3Rpb24gUHJpb3JpdHlRKGNvbXApIHtcclxuXHQgICAgaWYgKCFjb21wIHx8IGNvbXAubGVuZ3RoICE9IDIpIHtcclxuXHQgICAgICAgIHRocm93ICdhIHZhbGlkIGNvbXBhcmF0b3IgZnVuY3Rpb24gcmVxdWlyZWQnO1xyXG5cdCAgICB9XHJcblx0ICAgIHRoaXMuY29tcCA9IGNvbXA7XHJcblx0ICAgIHRoaXMuaXRlbXMgPSBbXTtcclxuXHR9XHJcblxyXG5cdFByaW9yaXR5US5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKGl0ZW0pIHtcclxuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XHJcblx0ICAgICAgICBpZiAodGhpcy5jb21wKGl0ZW0sIHRoaXMuaXRlbXNbaV0pKSB7XHJcblx0ICAgICAgICAgICAgdGhpcy5pdGVtcy5zcGxpY2UoaSwgMCwgaXRlbSk7XHJcblx0ICAgICAgICAgICAgcmV0dXJuO1xyXG5cdCAgICAgICAgfVxyXG5cdCAgICB9XHJcblx0ICAgIHRoaXMuaXRlbXNbaV0gPSBpdGVtO1xyXG5cdH07XHJcblxyXG5cdFByaW9yaXR5US5wcm90b3R5cGUucG9wID0gZnVuY3Rpb24oKSB7XHJcblx0ICAgIHJldHVybiB0aGlzLml0ZW1zLnNoaWZ0KCk7XHJcblx0fTtcclxuXHJcblx0UHJpb3JpdHlRLnByb3RvdHlwZS5wZWVrID0gZnVuY3Rpb24oKSB7XHJcblx0ICAgIHJldHVybiB0aGlzLml0ZW1zWzBdO1xyXG5cdH07XHJcblxyXG5cdFByaW9yaXR5US5wcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdCAgICByZXR1cm4gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblx0fTtcclxuXHJcblx0UHJpb3JpdHlRLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xyXG5cdCAgICB0aGlzLml0ZW1zID0gW107XHJcblx0fTtcclxuXHJcblx0UHJpb3JpdHlRLnByb3RvdHlwZS5pc0VtcHR5ID0gZnVuY3Rpb24oKSB7XHJcblx0ICAgIHJldHVybiB0aGlzLml0ZW1zLmxlbmd0aCA9PT0gMDtcclxuXHR9O1xyXG5cclxuXHRtb2R1bGUuZXhwb3J0cy5Qcmlvcml0eVEgPSBQcmlvcml0eVE7XHJcbiJdfQ==
