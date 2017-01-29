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