'use strict';
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { CircularArray } = require('circular-array');
const speech = require('@google-cloud/speech').v1p1beta1;
const textToSpeech = require('@google-cloud/text-to-speech');
const {Translate} = require('@google-cloud/translate');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('dist'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '')));



io.on('connection', (socket) => {
  console.log('New client connected: ' + socket.id);
  const clientData = {};
  clientData[socket.id] = {
    id: socket.id,
    speechClient: new speech.SpeechClient(),
    ttsClient: new textToSpeech.TextToSpeechClient(),
    translate: new Translate(),
    recognizeStream: null,
    restartTimeoutId: null,
    ttsText: '',
    translateText: '',
    voiceCode: 'fr-FR',
    speechLanguageCode: 'fr-FR-Wavenet-A',
    sttLanguageCode: 'en-US',
    speechModel: 'default',
    useEnhanced: 'false',
    enableAutomaticPunctuation: 'true',
    transcript: '',
    writeStream: null,
    currentResultEndTime: null,
    totalResultEndTime: 0,
    streamingLimit: 55000,
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

  function startStreaming() {
    const sttRequest = {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: clientData[socket.id].sttLanguageCode,
        enableAutomaticPunctuation:
          clientData[socket.id].enableAutomaticPunctuation,
      },
      interimResults: true,
    };
 /*
 Connect to API and keep sending from beginning of circular array…
 60 sec limit - error received? reconnect
 Finalize, reset
 Start sending from the beginning of the array
*/



    clientData[socket.id].recognizeStream = clientData[socket.id].speechClient
      .streamingRecognize(sttRequest)
      .on('error', (error) => {
        console.error;
      })
      .on('data', (data) => {
        socket.emit('getJSON', data);
        let resultEndTime = (data.results[0].resultEndTime.seconds*1000) +
          Math.round(data.results[0].resultEndTime.nanos/1000000);

          clientData[socket.id].resultEndTime = resultEndTime;
        if (data.results[0] && data.results[0].alternatives[0]) {
          console.log(
              'results ' +
              JSON.stringify(data.results[0].alternatives[0].transcript)
          );

          clientData[socket.id].transcript =
            data.results[0].alternatives[0].transcript;

          const transcriptObject = {
            transcript: data.results[0].alternatives[0].transcript,
            isfinal: data.results[0].isFinal,
            jsonObj: data
          };
          socket.emit('getTranscript', transcriptObject);

          if (data.results[0].isFinal) {
            console.log('also sending audio');
            clientData[socket.id].translateText = transcriptObject.transcript;
          }

        }
      });
    clientData[socket.id].restartTimeoutId =
      setTimeout(restartStreaming, clientData[socket.id].streamingLimit);
  }

  function stopStreaming() {
    console.log("current result end time in ms: " + clientData[socket.id].resultEndTime);

    clientData[socket.id].recognizeStream = null;

  }

  function restartStreaming() {
    stopStreaming();
    console.log("restarting stream, since " + clientData[socket.id].streamingLimit + " ms have passed");
    socket.emit("resetStreamOccurred", true);
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
