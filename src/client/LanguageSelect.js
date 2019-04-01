import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Grid from '@material-ui/core/Grid';
import { getVoiceList } from './api';

class LanguageSelects extends React.Component {

  _isMounted = false;

  constructor(props) {
    super(props);
    let socket = this.props.socket;
    this.state = {
      labelWidth: 0,
      languageCode: 'fr-FR',
      sttLanguage: 'en-US',
      voices: [],
      voiceSynth: '',
      voiceSynthOptions: '',
      voiceType: '',
      voiceTypes: [],
      voiceTypeOptions: '',
    };
    this.resetParentMic = this.resetParentMic.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;

    this.setState({
      labelWidth: ReactDOM.findDOMNode(this.InputLabelRef).offsetWidth,
    });

    getVoiceList((err, voicelist) => {
      if(this._isMounted){
        this.setState({ voices: voicelist }, () => this.populateVoiceSynthSelect());
      }
    });
  }

  componentWillUnmount(){
    this._isMounted = false;
  }
  handleSTTChange = (event) => {
    console.log("handle stt language change " + event.target.value);
    this.resetParentMic();
    this.setState({ sttLanguage: event.target.value }, () => this.emitSTTCode());
  };
  handleLanguageChange = (event) => {
    console.log("handle Language change " + event.target.value);
    this.resetParentMic();
    this.setState({languageCode: event.target.value }, () => this.populateVoiceSynthSelect());
  };
  handleSynthChange = (event) => {
    this.resetParentMic();
    console.log("handle synth change " + event.target.value);
    this.setState({ voiceSynth: event.target.value}, () => this.populateVoiceTypeSelect());
  };
  handleVoiceChange = (event) => {
    this.resetParentMic();
    console.log("handle voice change " + event.target.value);
    this.setState({ voiceType: event.target.value }, () => this.emitVoiceCode());
  };
  resetParentMic(){
    console.log("reset parent mic");
    this.props.resetMic();
  }

  emitVoiceCode(){
    let voiceType = this.state.voiceType;
    console.log("emitting voice code");
    let socket = this.props.socket;
    socket.emit("voiceCode", voiceType);
  }

  emitSTTCode(){
    let sttCode = this.state.sttLanguage;
    let socket = this.props.socket;
    socket.emit("sttLanguageCode", sttCode);
  }
  populateVoiceSynthSelect(){
    let languageCode = this.state.languageCode;
    console.log("populate synth with language code " + languageCode);
    let voiceObjects = [];
    let voicelist = this.state.voices;
    voiceObjects = voicelist.find(x => x.languageCode === languageCode).languageTypes;

    let voiceSynthOptionItems = voiceObjects.map((voiceSynth) =>
      <option key={voiceSynth.voiceSynth} value={voiceSynth.voiceSynth}>{voiceSynth.voiceSynth}</option>
    );
    this.setState({voiceTypes: voiceObjects});
    this.setState({voiceSynthOptions: voiceSynthOptionItems});
    if(voiceSynthOptionItems.length>1){
      this.setState({voiceSynth: voiceSynthOptionItems[1].key}, () => this.populateVoiceTypeSelect());
    }
    else {
      this.setState({voiceSynth: voiceSynthOptionItems[0].key}, () => this.populateVoiceTypeSelect());
    }
  }
  populateVoiceTypeSelect(){
    let voiceSynth = this.state.voiceSynth;
    let voiceObjects, voiceTypeOptionItems = [];

    let voicelist = this.state.voiceTypes;
    voiceObjects = voicelist.find(x => x.voiceSynth === voiceSynth).voiceTypes;

    voiceTypeOptionItems = voiceObjects.map((voiceType) =>
      <option key={voiceType.voiceCode} value={voiceType.voiceCode}>{voiceType.voiceName}</option>
    );


    this.setState({voiceTypeOptions: voiceTypeOptionItems});
    if((this.state.languageCode=='en-US') && (voiceSynth=='Wavenet')){
      this.setState({voiceType: "en-US-Wavenet-D"});
      let event = { target: { value: 'en-US-Wavenet-D'}};
        this.handleVoiceChange(event);
    }
    else{
      this.setState({voiceType: voiceTypeOptionItems[0].key});
      let event = { target: { value: voiceTypeOptionItems[0].key}};
        this.handleVoiceChange(event);
    }
  }

  render() {

    return (
      <div>
              <InputLabel ref={ref => {
                this.InputLabelRef = ref;
              }} htmlFor="stt-language">Language</InputLabel>
              <Select
                native
                value={this.state.sttLanguage}
                onChange={this.handleSTTChange}
                inputProps={{
                  name: 'stt_language',
                  id: 'stt-language',
                }}
              >
                <option value="af-ZA"> Afrikaans (Suid-Afrika)</option>
                <option value="am-ET"> አማርኛ (ኢትዮጵያ)</option>
                <option value="hy-AM"> Հայ (Հայաստան)</option>
                <option value="az-AZ"> Azərbaycan (Azərbaycan)</option>
                <option value="id-ID"> Bahasa Indonesia (Indonesia)</option>
                <option value="ms-MY"> Bahasa Melayu (Malaysia)</option>
                <option value="bn-BD"> বাংলা (বাংলাদেশ)</option>
                <option value="bn-IN"> বাংলা (ভারত)</option>
                <option value="ca-ES"> Català (Espanya)</option>
                <option value="cs-CZ"> Čeština (Česká republika)</option>
                <option value="da-DK"> Dansk (Danmark)</option>
                <option value="de-DE"> Deutsch (Deutschland)</option>
                <option value="en-AU"> English (Australia)</option>
                <option value="en-CA"> English (Canada)</option>
                <option value="en-GH"> English (Ghana)</option>
                <option value="en-GB"> English (Great Britain)</option>
                <option value="en-IN"> English (India)</option>
                <option value="en-IE"> English (Ireland)</option>
                <option value="en-KE"> English (Kenya)</option>
                <option value="en-NZ"> English (New Zealand)</option>
                <option value="en-NG"> English (Nigeria)</option>
                <option value="en-PH"> English (Philippines)</option>
                <option value="en-SG"> English (Singapore)</option>
                <option value="en-ZA"> English (South Africa)</option>
                <option value="en-TZ"> English (Tanzania)</option>
                <option value="en-US"> English (United States)</option>
                <option value="es-AR"> Español (Argentina)</option>
                <option value="es-BO"> Español (Bolivia)</option>
                <option value="es-CL"> Español (Chile)</option>
                <option value="es-CO"> Español (Colombia)</option>
                <option value="es-CR"> Español (Costa Rica)</option>
                <option value="es-EC"> Español (Ecuador)</option>
                <option value="es-SV"> Español (El Salvador)</option>
                <option value="es-ES"> Español (España)</option>
                <option value="es-US"> Español (Estados Unidos)</option>
                <option value="es-GT"> Español (Guatemala)</option>
                <option value="es-HN"> Español (Honduras)</option>
                <option value="es-MX"> Español (México)</option>
                <option value="es-NI"> Español (Nicaragua)</option>
                <option value="es-PA"> Español (Panamá)</option>
                <option value="es-PY"> Español (Paraguay)</option>
                <option value="es-PE"> Español (Perú)</option>
                <option value="es-PR"> Español (Puerto Rico)</option>
                <option value="es-DO"> Español (República Dominicana)</option>
                <option value="es-UY"> Español (Uruguay)</option>
                <option value="es-VE"> Español (Venezuela)</option>
                <option value="eu-ES"> Euskara (Espainia)</option>
                <option value="fil-PH"> Filipino (Pilipinas)</option>
                <option value="fr-CA"> Français (Canada)</option>
                <option value="fr-FR"> Français (France)</option>
                <option value="gl-ES"> Galego (España)</option>
                <option value="ka-GE"> ქართული (საქართველო)</option>
                <option value="gu-IN"> ગુજરાતી (ભારત)</option>
                <option value="hr-HR"> Hrvatski (Hrvatska)</option>
                <option value="zu-ZA"> IsiZulu (Ningizimu Afrika)</option>
                <option value="is-IS"> Íslenska (Ísland)</option>
                <option value="it-IT"> Italiano (Italia)</option>
                <option value="jv-ID"> Jawa (Indonesia)</option>
                <option value="kn-IN"> ಕನ್ನಡ (ಭಾರತ)</option>
                <option value="km-KH"> ភាសាខ្មែរ (កម្ពុជា)</option>
                <option value="lo-LA"> ລາວ (ລາວ)</option>
                <option value="lv-LV"> Latviešu (latviešu)</option>
                <option value="lt-LT"> Lietuvių (Lietuva)</option>
                <option value="hu-HU"> Magyar (Magyarország)</option>
                <option value="ml-IN"> മലയാളം (ഇന്ത്യ)</option>
                <option value="mr-IN"> मराठी (भारत)</option>
                <option value="nl-NL"> Nederlands (Nederland)</option>
                <option value="ne-NP"> नेपाली (नेपाल)</option>
                <option value="nb-NO"> Norsk bokmål (Norge)</option>
                <option value="pl-PL"> Polski (Polska)</option>
                <option value="pt-BR"> Português (Brasil)</option>
                <option value="pt-PT"> Português (Portugal)</option>
                <option value="ro-RO"> Română (România)</option>
                <option value="si-LK"> සිංහල (ශ්රී ලංකාව)</option>
                <option value="sk-SK"> Slovenčina (Slovensko)</option>
                <option value="sl-SI"> Slovenščina (Slovenija)</option>
                <option value="su-ID"> Urang (Indonesia)</option>
                <option value="sw-TZ"> Swahili (Tanzania)</option>
                <option value="sw-KE"> Swahili (Kenya)</option>
                <option value="fi-FI"> Suomi (Suomi)</option>
                <option value="sv-SE"> Svenska (Sverige)</option>
                <option value="ta-IN"> தமிழ் (இந்தியா)</option>
                <option value="ta-SG"> தமிழ் (சிங்கப்பூர்)</option>
                <option value="ta-LK"> தமிழ் (இலங்கை)</option>
                <option value="ta-MY"> தமிழ் (மலேசியா)</option>
                <option value="te-IN"> తెలుగు (భారతదేశం)</option>
                <option value="vi-VN"> Tiếng Việt (Việt Nam)</option>
                <option value="tr-TR"> Türkçe (Türkiye)</option>
                <option value="ur-PK"> اردو (پاکستان)</option>
                <option value="ur-IN"> اردو (بھارت)</option>
                <option value="el-GR"> Ελληνικά (Ελλάδα)</option>
                <option value="bg-BG"> Български (България)</option>
                <option value="ru-RU"> Русский (Россия)</option>
                <option value="sr-RS"> Српски (Србија)</option>
                <option value="uk-UA"> Українська (Україна)</option>
                <option value="he-IL"> עברית (ישראל)</option>
                <option value="ar-IL"> العربية (إسرائيل)</option>
                <option value="ar-JO"> العربية (الأردن)</option>
                <option value="ar-AE"> العربية (الإمارات)</option>
                <option value="ar-BH"> العربية (البحرين)</option>
                <option value="ar-DZ"> العربية (الجزائر)</option>
                <option value="ar-SA"> العربية (السعودية)</option>
                <option value="ar-IQ"> العربية (العراق)</option>
                <option value="ar-KW"> العربية (الكويت)</option>
                <option value="ar-MA"> العربية (المغرب)</option>
                <option value="ar-TN"> العربية (تونس)</option>
                <option value="ar-OM"> العربية (عُمان)</option>
                <option value="ar-PS"> العربية (فلسطين)</option>
                <option value="ar-QA"> العربية (قطر)</option>
                <option value="ar-LB"> العربية (لبنان)</option>
                <option value="ar-EG"> العربية (مصر)</option>
                <option value="fa-IR"> فارسی (ایران)</option>
                <option value="hi-IN"> हिन्दी (भारत)</option>
                <option value="th-TH"> ไทย (ประเทศไทย)</option>
                <option value="ko-KR"> 한국어 (대한민국)</option>
                <option value="zh-TW"> 國語 (台灣)</option>
                <option value="yue-Hant-HK"> 廣東話 (香港)</option>
                <option value="ja-JP"> 日本語（日本)</option>
                <option value="zh-HK"> 普通話 (香港)</option>
                <option value="zh"> 普通话 (中国大陆)</option>
              </Select>
      </div>
    );
  }
}

export default LanguageSelects;
