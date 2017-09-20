/**
 *
 */
'use strict';
const vlog = require('vlog').instance(__filename);

/**
 * pipe function,可自动调节输入流的速度
 * @param  {Object}   inObj    input object which have sync next()
 * @param  {Object}   outObj   output object which have async next(data,callback)
 * @param  {int}   pipeMaxSize         the pipe's max size
 * @param  {Function} callback
 * @return {}
 */
const sendToPipe = function sendToPipe(inObj, outObj, pipeMaxSize, callback) {
  const pipe = [];
  let isInFinished = false; //输入流结束的标记
  let pipeSize = 0; //当前pipe的size
  let fullTimes = 0; //pipe变満的次数
  const fullWaitMilliSecond = 10; //等待毫秒数，从10毫秒开始
  let inSpeedControl = 0; //控制输入流的速度，pipe満一次，速度自动降低, 即输入流的等待时间为 fullWaitMilliSecond * inSpeedControl
  const pipeIn = function pipeIn() {
    if (pipeSize >= pipeMaxSize) {
      fullTimes++;
      inSpeedControl++;
      console.log('pipe full when input, fullTimes:%d, pipeSize:%d, inSpeedControl:%d', fullTimes, pipe.length, inSpeedControl);
      return setTimeout(pipeIn, fullWaitMilliSecond * inSpeedControl);
    }
    const data = inObj.next();
    if (data === null) {
      isInFinished = true;
      console.log('pipe in finished.', pipe.length);
      return;
    }
    pipe.unshift(data);
    pipeSize++;
    return setTimeout(pipeIn, fullWaitMilliSecond * inSpeedControl);
  };

  const pipeOut = function pipeOut() {
    if (pipeSize <= 0) {
      console.log('pipe empty', pipe.length);
      if (isInFinished) {
        return;
      }
      return setTimeout(pipeOut, fullWaitMilliSecond);
    } else if (pipeSize >= pipeMaxSize) {
      console.log('pipe full when out, will wait', pipe.length);
      return setTimeout(pipeOut, fullWaitMilliSecond);
    }
    const data = pipe.pop();
    if (!data) {
      console.error('pipeSize !== 0 but no data', pipe.length);
      return setTimeout(pipeOut, fullWaitMilliSecond);
    }
    process.nextTick(function() {
      outObj.next(data, (err) => {
        if (err) {
          vlog.eo(err, 'outObj err', pipe.length);
        }
        const pSize = --pipeSize;
        if (isInFinished && pSize <= 0) {
          //all done
          callback(null);
        }
      });
    });
    return pipeOut();
  };
  pipeIn();
  setTimeout(pipeOut, fullWaitMilliSecond);
};

exports.sendToPipe = sendToPipe;