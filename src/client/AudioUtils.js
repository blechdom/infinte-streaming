import {socket, ss, stream} from './api';

let bufferSize = 2048;
let processor;
let input;
let globalStream;

const constraints = {
  audio: true,
  video: false,
};

function startStreaming(context) {
  bufferSize = 2048;
  processor = null;
  input = null;
  globalStream = null;

  processor = context.createScriptProcessor(bufferSize, 1, 1);
  processor.connect(context.destination);
  context.resume();

  const handleSuccess = function(stream) {
    globalStream = stream;
    if (input == undefined) {
      input = context.createMediaStreamSource(stream);
    }
    input.connect(processor);

    processor.onaudioprocess = function(e) {
      microphoneProcess(e);
    };
  };

  navigator.mediaDevices.getUserMedia(constraints)
      .then(handleSuccess);
}

function microphoneProcess(e) {
  const left = e.inputBuffer.getChannelData(0);
  const left16 = downsampleBuffer(left, 44100, 16000);
  socket.emit('binaryStream', left16);
}

function stopStreaming(context) {
  const track = globalStream.getTracks()[0];
  track.stop();
  if (input) {
    input.disconnect(processor);
    processor.disconnect();
  }
}
const downsampleBuffer = function(buffer, sampleRate, outSampleRate) {
  if (outSampleRate == sampleRate) {
    return buffer;
  }
  if (outSampleRate > sampleRate) {
    const e = new Error(
        'downsample rate must be less than original sample rate');
    throw e;
  }
  const sampleRateRatio = sampleRate / outSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0; let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }

    result[offsetResult] = Math.min(1, accum / count)*0x7FFF;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result.buffer;
};
export {startStreaming, stopStreaming};
