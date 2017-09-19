/**
 *
 */
'use strict';
const fs = require('fs');

let pipeSize = 1;

const pipeCall = function pipeCall(callback) {
  pipeSize--;
  if (pipeSize <= 0) {
    callback(null);
  }
};


const readFileLines = function readFileLines(file, lineFn, callback) {
  //
};