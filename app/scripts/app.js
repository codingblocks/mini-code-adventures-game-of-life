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
var size = 2;
var rowCount = canvas.height / size;
var columnCount = canvas.width / size;

var generateInitialState = function (rowCount, columnCount) {
  var maze = require('amazejs');
  var m = new maze.Backtracker(columnCount, rowCount);
  m.generate();
  var matrix = [];
  for(var row = 0; row < m.height; row++) {
    matrix[row] = [];
    for(var col = 0; col < m.width; col++) {
      var state = m.get(row, col) ? 1 : 0;
      matrix[row].push(state);
    }
  }
  return matrix;
}

var GameOfLife = require('game-of-life-logic');
var gameOfLife = new GameOfLife(columnCount, rowCount)
gameOfLife.copyMatrixAt(1, 1, generateInitialState(rowCount, columnCount));

var drawGame = function(m) {
  for(var row = 0; row < m.length; row++) {
    for(var col = 0; col < m[row].length; col++) {
      if(m[row][col]) {
        pen.fillStyle = '#000000';
      } else {
        pen.fillStyle = '#FFFFFF';
      }
      pen.fillRect(col * size, row * size, size, size);
    }
  }
}

var step = function() {
  drawGame(gameOfLife.matrix);
  gameOfLife.tick();
}

// draw the game every {intervalMs}
var intervalMs = 500;
setInterval(step, intervalMs);

// TODO how best to stop the interval?