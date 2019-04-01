import React from 'react';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import FormControl from '@material-ui/core/FormControl';
import LanguageSelects from './LanguageSelect';
import MultilineOutput from './MultilineOutput';
import APIOutput from './APIOutput';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import {socket} from './api';
import {startStreaming, stopStreaming} from './AudioUtils';

const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  formControl: {
    margin: theme.spacing.unit,
    padding: theme.spacing.unit,
    //minWidth: 260,
  },
});

class SpeechTranslateSpeech extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      audio: false,
      micText: 'Click to Start',
      started: false,
      reset: 0,
      restartTime: '55000',
      counterStart: null
    };
    this.toggleListen = this.toggleListen.bind(this);
    this.resetMic = this.resetMic.bind(this);
  }

  componentDidMount() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  handleNumberChange(evt) {
      const restartTime = (evt.target.validity.valid) ? evt.target.value : this.state.restartTime;
      this.setState({ restartTime });
      socket.emit('setStreamingLimit', restartTime);
    }
  componentWillUnmount() {
    this.stopListening();
    this.audioContext.close();
  }

  async startListening() {
    if (!this.state.audio) {
      socket.emit('startStreaming', true);
      startStreaming(this.audioContext);
      this.setState({audio: true, started: true});
    }
  }
  stopListening() {
    if (this.state.audio) {
      socket.emit('stopStreaming', true);
      this.setState({audio: false});
      stopStreaming(this.audioContext);
    }
  }
  toggleListen() {
    if (!this.state.started) {
      this.setState({micText: 'Mic Off', started: true});
    }
    if (this.state.audio) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }
  async resetMic() {
    console.log('resetting mic and stream');
    const resetCount = this.state.reset + 1;
    this.setState({
      micText: 'Click to Start',
      started: false,
      reset: resetCount,
    });
    await this.stopListening();
    // Reset count has to be set twice for it to register when STT language changes. I tried to find another way.
    this.setState({
      reset: resetCount,
    });
  }

  render() {
    const { classes } = this.props;
    return (
      <React.Fragment>
        <Grid container spacing={24}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl className={classes.formControl}>
              <LanguageSelects socket={socket} resetMic={this.resetMic}/>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl className={classes.formControl}>
              <TextField
                id="outlined-number"
                label="Restart time in ms"
                value={this.state.restartTime}
                onChange={this.handleNumberChange.bind(this)}
                type="number"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl className={classes.formControl}>
              <Button variant="contained" color={this.state.audio ? 'secondary' : 'primary'} onClick={this.toggleListen}>{this.state.audio ? 'Mic Active' : this.state.micText}</Button>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <MultilineOutput socket={socket} reset={this.state.reset}/>
          </Grid>
          <Grid item xs={12}>
            <APIOutput socket={socket} reset={this.state.reset}/>
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(SpeechTranslateSpeech);
