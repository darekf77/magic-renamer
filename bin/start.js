Error.stackTraceLimit = 100;
global.i0 = {
  defineInjectable: function () { }
}
const process= require('process');
process.removeAllListeners('warning');

const fs = require('fs');
const path = require('path');
var pathDist = {
  dist: path.join(__dirname, '../dist/cli.js'),
  bundle: path.join(__dirname, '../cli.js')
}
var p = fs.existsSync(pathDist.dist) ? pathDist.dist : path.bundle;
global.globalSystemToolMode = true;
var run = require(p).start;
run(process.argv.slice(2));