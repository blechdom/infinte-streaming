import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:8080');
let lastEndTime = 0;

function getJSON(cb) {
  socket.on('getJSON', (response) => cb(null, response));
}
function subscribeToTimer(cb) {
  socket.on('timer', timestamp => cb(null, timestamp));
}
function setStreamingLimit(restartTime){
  socket.emit('setStreamingLimit', restartTime);
}
function setSTTLanguageCode(sttCode){
  socket.emit("sttLanguageCode", sttCode);
}
function getTranscriptFromJSON(cb) {
  socket.on('getJSON', (response) => {
    let transcript = response.results[0].alternatives[0].transcript;
    let isFinal = response.results[0].isFinal;
    let endTime = response.results[0].resultEndTime.seconds * 1000 +
      Math.round(response.results[0].resultEndTime.nanos / 1000000);
    let startTime = lastEndTime;
    if (isFinal){
      startTime = response.results[0].alternatives[0].words[0].startTime.seconds * 1000 +
        Math.round(response.results[0].alternatives[0].words[0].startTime.nanos / 1000000);
      lastEndTime = endTime;
    }
    const transcriptObject = {
        transcript: transcript,
        isFinal: isFinal,
        startTime: startTime,
        endTime: endTime,
        isRestart: false,
    };
    cb(null, transcriptObject);
  });
}
function requestRestarted(cb){
  socket.on('resetStreamOccurred', (data) => {
    const restartObject = {
        transcript: 'Restart',
        isFinal: true,
        startTime: data,
        endTime: data,
        isRestart: true,
    };
    cb(null, restartObject);
  });
}

export {
  socket,
  getJSON,
  subscribeToTimer,
  setStreamingLimit,
  setSTTLanguageCode,
  getTranscriptFromJSON,
  requestRestarted,
};
