import openSocket from 'socket.io-client';
import ss from './socket.io-stream.js';
const socket = openSocket('http://localhost:8080');
let stream = ss.createStream();

function getVoiceList(cb) {
  socket.emit('getVoiceList', true);
  socket.on('voicelist', function(data) {
    const voicelist = JSON.parse(data);
    cb(null, voicelist);
  });
}

export {socket, getVoiceList, ss, stream};
