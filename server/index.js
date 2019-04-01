'use strict';
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const {Translate} = require('@google-cloud/translate');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('dist'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '')));

const STREAMING_LIMIT = 55000;
// const ISFINAL_LIMIT = 6000;

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
    // forcedIsFinal: false,
  };

  socket.on('translate-text', function(data) {
    clientData[socket.id].translateText = data;
  });

  socket.on('voiceCode', function(data) {
    console.log('voice code: ' + data);
    clientData[socket.id].voiceCode = data;
  });

  socket.on('speechLanguageCode', function(data) {
    clientData[socket.id].speechLanguageCode = data;
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

  socket.on('getVoiceList', function(data) {
    async function getList() {
      try {
        const [result] = await clientData[socket.id].ttsClient.listVoices({});
        const voiceList = result.voices;

        voiceList.sort(function(a, b) {
          const textA = a.name.toUpperCase();
          const textB = b.name.toUpperCase();
          return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });
        let languageObject = {};
        let languageName = '';
        let languageCode = '';
        let lastVoice = '';
        let languageTypes = [];

        const formattedVoiceList = [];

        for (let i = 0; i<voiceList.length; i++) {
          const voice = voiceList[i];
          languageCode = voice.languageCodes[0];
          if (languageCode!=lastVoice) {
            if (languageObject.languageName!=null) {
              languageObject.languageTypes = formatLanguageTypes(languageTypes);
              formattedVoiceList.push(languageObject);

              languageObject = {};
              languageTypes = [];
            }

            languageName = convertLanguageCodes(languageCode);
            languageObject.languageName = languageName;
            languageObject.languageCode = languageCode;

            languageTypes.push({
              voice: voice.name,
              gender: voice.ssmlGender,
              rate: voice.naturalSampleRateHertz,
            });

            lastVoice = languageCode;
          } else {
            languageTypes.push({
              voice: voice.name,
              gender: voice.ssmlGender,
              rate: voice.naturalSampleRateHertz,
            });
          }
          if (i==(voiceList.length-1)) {
            languageObject.languageTypes = formatLanguageTypes(languageTypes);
            formattedVoiceList.push(languageObject);

            languageObject = {};
            languageTypes = [];
          }
        }
        socket.emit('voicelist', JSON.stringify(formattedVoiceList));
      } catch (err) {
        console.log(err);
      }
    }
    getList();
  });

  socket.on('getAudioFile', function(data) {
    ttsTranslateAndSendAudio();
  });

  socket.on('disconnect', function() {
    console.log('client disconnected');
  });

  async function ttsTranslateAndSendAudio() {
    const translateLanguageCode =
      clientData[socket.id].voiceCode.substring(0, 2);
    const target = translateLanguageCode;
    console.log('translating into ' + target);
    const text = clientData[socket.id].translateText;
    console.log('text to translate: ' + text);
    let [translations] =
      await clientData[socket.id].translate.translate(text, target);
    translations = Array.isArray(translations) ? translations : [translations];
    let translationConcatenated = '';
    translations.forEach((translation, i) => {
      translationConcatenated += translation + ' ';
    });
    clientData[socket.id].ttsText = translationConcatenated;
    socket.emit('getTranslation', translationConcatenated);

    const ttsRequest = {
      voice: {
        languageCode: clientData[socket.id].voiceCode.substring(0, 5),
        name: clientData[socket.id].voiceCode,
      },
      audioConfig: {audioEncoding: 'LINEAR16'},
      input: {text: clientData[socket.id].ttsText},
    };
    const [response] =
      await clientData[socket.id].ttsClient.synthesizeSpeech(ttsRequest);
    socket.emit('audiodata', response.audioContent);
  }
  function startStreaming() {
    const sttRequest = {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: clientData[socket.id].sttLanguageCode,
        enableAutomaticPunctuation:
          clientData[socket.id].enableAutomaticPunctuation,
        model: clientData[socket.id].speechModel,
        useEnhanced: clientData[socket.id].useEnhanced,
      },
      interimResults: true,
    };
    // let isFinalTimeoutID = 0;
    // console.log("startStream request " +
    //  JSON.stringify(sttRequest, null, 4));
    clientData[socket.id].recognizeStream = clientData[socket.id].speechClient
        .streamingRecognize(sttRequest)
        .on('error', (error) => {
          console.error;
        })
        .on('data', (data) => {
          if (data.results[0] && data.results[0].alternatives[0]) {
            console.log(
                'results ' +
                JSON.stringify(data.results[0].alternatives[0].transcript)
            );
            //  clientData[socket.id].forcedIsFinal = false;
            clientData[socket.id].transcript =
              data.results[0].alternatives[0].transcript;
            //  clearTimeout(isFinalTimeoutID);
            // console.log("clear timeout " + isFinalTimeoutID);
            // isFinalTimeoutID = setTimeout(
            //  forceIsFinal,
            //  ISFINAL_LIMIT,
            //  isFinalTimeoutID);
            // console.log("set timeout " + isFinalTimeoutID);
            //  if(!clientData[socket.id].forcedIsFinal){
            const transcriptObject = {
              transcript: data.results[0].alternatives[0].transcript,
              isfinal: data.results[0].isFinal,
            };
            socket.emit('getTranscript', transcriptObject);

            if (data.results[0].isFinal) {
              console.log('also sending audio');
              clientData[socket.id].translateText = transcriptObject.transcript;
              ttsTranslateAndSendAudio();
              //    clearTimeout(isFinalTimeoutID);
            }
          // }
          }
        });

    clientData[socket.id].restartTimeoutId =
      setTimeout(restartStreaming, STREAMING_LIMIT);
  }
  /* function forceIsFinal(isFinalTimeoutID){
      clientData[socket.id].forcedIsFinal = true;
      clearTimeout(isFinalTimeoutID);
      restartStreaming();
      console.log("forcing clear timeout " + isFinalTimeoutID);
      console.log("forcing is final");
      var transcriptObject = {
        transcript: clientData[socket.id].transcript,
        isfinal: true
      };
      socket.emit("getTranscript", transcriptObject);

      console.log("forcing send of audio file");
      clientData[socket.id].translateText = transcriptObject.transcript;
      ttsTranslateAndSendAudio();
      clientData[socket.id].translateText = '';
      clientData[socket.id].transcript = '';
    }*/
  function stopStreaming() {
    clientData[socket.id].recognizeStream = null;
  }

  function restartStreaming() {
    stopStreaming();
    startStreaming();
  }

  function formatLanguageTypes(voiceObjects) {
    let voiceTypes = [];
    const voiceSynths = [];

    let lastSynth = '';
    let currentSynth = '';
    let tempVoiceObject = {};

    for (let i = 0; i<voiceObjects.length; i++) {
      currentSynth = voiceObjects[i].voice.slice(6, -2);

      if (currentSynth!=lastSynth) {
        if (tempVoiceObject.voiceSynth!=null) {
          tempVoiceObject.voiceTypes = voiceTypes;
          voiceSynths.push(tempVoiceObject);
          tempVoiceObject = {};
          voiceTypes = [];
        }
        tempVoiceObject.voiceSynth = currentSynth;

        lastSynth = currentSynth;
      }
      voiceTypes.push({
        voiceCode: voiceObjects[i].voice,
        voiceName:
          voiceObjects[i].voice.substr(voiceObjects[i].voice.length - 1) +
          ' (' + voiceObjects[i].gender.substr(0, 1).toLowerCase() + ')',
      });

      if (i==(voiceObjects.length-1)) {
        tempVoiceObject.voiceTypes = voiceTypes;
        voiceSynths.push(tempVoiceObject);
        tempVoiceObject = {};
        voiceTypes = [];
      }
    }
    return voiceSynths;
  }

  function convertLanguageCodes(languageCode) {
    let languageName;
    switch (languageCode) {
      case 'da-DK':
        languageName = 'Danish';
        break;
      case 'de-DE':
        languageName = 'German';
        break;
      case 'en-AU':
        languageName = 'English (Australia)';
        break;
      case 'en-GB':
        languageName = 'English (United Kingdom)';
        break;
      case 'en-US':
        languageName = 'English (United States)';
        break;
      case 'es-ES':
        languageName = 'Spanish';
        break;
      case 'fr-CA':
        languageName = 'French (Canada)';
        break;
      case 'fr-FR':
        languageName = 'French';
        break;
      case 'it-IT':
        languageName = 'Italian';
        break;
      case 'ja-JP':
        languageName = 'Japanese';
        break;
      case 'ko-KR':
        languageName = 'Korean';
        break;
      case 'nl-NL':
        languageName = 'Dutch';
        break;
      case 'nb-NO':
        languageName = 'Norwegian';
        break;
      case 'pl-PL':
        languageName = 'Polish';
        break;
      case 'pt-BR':
        languageName = 'Portugese (Brazil)';
        break;
      case 'pt-PT':
        languageName = 'Portugese';
        break;
      case 'ru-RU':
        languageName = 'Russian';
        break;
      case 'sk-SK':
        languageName = 'Slovak (Slovakia)';
        break;
      case 'sv-SE':
        languageName = 'Swedish';
        break;
      case 'tr-TR':
        languageName = 'Turkish';
        break;
      case 'uk-UA':
        languageName = 'Ukrainian (Ukraine)';
        break;
      default:
        languageName = languageCode;
    }
    return languageName;
  }
});
if (module === require.main) {
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
  });
}
