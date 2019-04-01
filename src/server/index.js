'use strict';
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { CircularArray } = require('circular-array');
const speech = require('@google-cloud/speech').v1p1beta1;
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('dist'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '')));

 /*
 Connect to API and keep sending from beginning of circular array…
 60 sec limit - error received? reconnect
 Finalize, reset
 Start sending from the beginning of the array
*/


io.on('connection', (socket) => {
  console.log('New client connected: ' + socket.id);
  const clientData = {};
  clientData[socket.id] = {
    id: socket.id,
    speechClient: new speech.SpeechClient(),
    recognizeStream: null,
    restartTimeoutId: null,
    intervalTimerId: null,
    sttLanguageCode: 'en-US',
    currentResultEndTime: null,
    totalResultEndTime: 0,
    streamingLimit: 10000,
  };

  socket.on('setStreamingLimit', function(data){
    clientData[socket.id].streamingLimit = data;
  });

  socket.on('sttLanguageCode', function(data) {
    clientData[socket.id].sttLanguageCode = data;
  });

  socket.on('startStreaming', function(data) {
    console.log('starting to stream');
    startStreaming();
  });

  socket.on('binaryStream', function(data) {
    if (clientData[socket.id].recognizeStream!=null) {
      clientData[socket.id].recognizeStream.write(data);
    }
  });

  socket.on('stopStreaming', function(data) {
    clearTimeout(clientData[socket.id].restartTimeoutId);
    stopStreaming();
  });

  socket.on('disconnect', function() {
    console.log('client disconnected');
  });

  function intervalTimer(restartTime, interval){
    clientData[socket.id].intervalTimerId = setInterval(() => {
      socket.emit('timer', new Date() - restartTime);
      let timepassed = new Date() - restartTime;
      if((timepassed%10)==0){
        //console.log(timepassed);
      }
    }, interval);
  }
  function startStreaming() {
    intervalTimer(new Date(), 10);


    const sttRequest = {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: clientData[socket.id].sttLanguageCode,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true,
      },
      interimResults: true,
    };

    clientData[socket.id].recognizeStream = clientData[socket.id].speechClient
      .streamingRecognize(sttRequest)
      .on('error', (error) => {
        console.error;
      })
      .on('data', emitCallback);

    clientData[socket.id].restartTimeoutId =
      setTimeout(restartStreaming, clientData[socket.id].streamingLimit);
  }

  function stopStreaming() {
    clearInterval(clientData[socket.id].intervalTimerId);
    clientData[socket.id].recognizeStream = null;
  }
  const emitCallback = (stream) => {
    socket.emit('getJSON', stream);
  };
  function restartStreaming() {
    clientData[socket.id].recognizeStream.removeListener('data', emitCallback);
    clientData[socket.id].recognizeStream = null;
    stopStreaming();
    socket.emit("resetStreamOccurred", clientData[socket.id].streamingLimit);
    startStreaming();
  }

});
if (module === require.main) {
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
  });
}
