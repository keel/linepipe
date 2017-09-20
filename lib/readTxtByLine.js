'use strict';

const fs = require('fs');
const os = require('os');


/**
 * Get a line from buffer & return it + remaining buffer
 *
 * @param {Buffer} buffer
 */
function getLine(buffer, eol) {
  let end = 0;
  for (let i = 0; i < buffer.length; i++) {
    //detect end of line '\n'
    if (buffer[i] === 0x0a) {
      //account for windows '\r\n'
      end = i - (eol.length - 1);
      return {
        'line': buffer.slice(0, end).toString(),
        'newBuffer': buffer.slice(i + 1)
      };
    }
  }
  return null;
}


/**
 * Read file line by line synchronous
 *
 * @param {String} path
 * @param {String} encoding - "optional" encoding in same format as nodejs Buffer
 * @param {String} eol - "optional" eol, if user wants to specify an End-Of-Line different than the OS
 */
function readLine(path, startPosition = 0, bufSize = 64 * 1024, encoding = 'utf8', eol = os.EOL) {

  const lineArr = [];

  const buf_alloc = function(buf_size) {
    return Buffer.alloc(buf_size, 0, encoding);
  };

  const chunkSize = 64 * 1024; //64K
  let bufferSize = chunkSize;
  let curBuffer = buf_alloc(0);
  let readBuffer;

  if (!fs.existsSync(path)) {
    throw new Error('no such file or directory "' + path + '"');
  }

  const fsize = fs.statSync(path).size;

  if (fsize < chunkSize) {
    bufferSize = fsize;
  }

  const numOfLoops = Math.floor(fsize / bufferSize);
  const remainder = fsize % bufferSize;

  const fd = fs.openSync(path, 'r');
  let i = 0;
  for (; i < numOfLoops; i++) {
    readBuffer = buf_alloc(bufferSize);

    fs.readSync(fd, readBuffer, 0, bufferSize, bufferSize * i);

    curBuffer = Buffer.concat([curBuffer, readBuffer], curBuffer.length + readBuffer.length);
    let lineObj = getLine(curBuffer, eol);
    while (lineObj) {
      curBuffer = lineObj.newBuffer;
      processline(lineObj.line);
      lineObj = getLine(curBuffer, eol);
    }
  }

  if (remainder > 0) {
    readBuffer = buf_alloc(remainder);

    fs.readSync(fd, readBuffer, 0, remainder, bufferSize * i);

    curBuffer = Buffer.concat([curBuffer, readBuffer], curBuffer.length + readBuffer.length);
    let lineObj = getLine(curBuffer, eol);
    while (lineObj) {
      curBuffer = lineObj.newBuffer;
      processline(lineObj.line);
      lineObj = getLine(curBuffer, eol);
    }
  }

  //return last remainings in the buffer in case
  //it didn't have any more lines
  if (curBuffer.length) {
    processline(curBuffer.toString());
  }

  fs.closeSync(fd);
}

exports.readLine = readLine;

readLine('pipe.js',(line) => {
  console.log('==> '+line);
});
