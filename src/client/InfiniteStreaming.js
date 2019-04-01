import React from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import LanguageSelects from './LanguageSelect';
import MultilineOutput from './MultilineOutput';
import APIOutput from './APIOutput';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import {socket, subscribeToTimer, setStreamingLimit} from './api';
import {startStreaming, stopStreaming} from './AudioUtils';

const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  paper: {
    flexGrow: 1,
    margin: theme.spacing.unit * 3,
    padding: theme.spacing.unit * 3,
  },
  formControl: {
    margin: theme.spacing.unit,
    padding: theme.spacing.unit,
    //minWidth: 260,
  },
});

class InfiniteStreaming extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      audio: false,
      micText: 'Click to Start',
      started: false,
      reset: 0,
      restartTime: '10000',
      counterStart: null,
      timestamp: '00:00:00'
    };
    this.toggleListen = this.toggleListen.bind(this);

    subscribeToTimer((err, timestamp) =>
      this.setState({ timestamp })
    );
  }
  handleNumberChange(evt) {
    const restartTime =
      (evt.target.validity.valid) ? evt.target.value : this.state.restartTime;
    this.setState({ restartTime });
    setStreamingLimit(restartTime);
  }
  componentWillUnmount() {
    this.stopListening();
    if(this.audioContext){
      this.audioContext.close();
    }
  }
  startListening() {
    startStreaming(this.audioContext);
    this.setState({audio: true, started: true});
  }
  stopListening() {
    this.setState({audio: false});
    stopStreaming(this.audioContext);
  }
  toggleListen() {
    if (!this.state.started) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.setState({micText: 'Click to Start', started: true});
    }
    if (this.state.audio) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <React.Fragment>
        <Grid container spacing={24}>
          <Paper elevation={1} className={classes.paper} id="streaming-control" ref="streaming-control">
              <Grid container spacing={24}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl className={classes.formControl}>
                <LanguageSelects />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl className={classes.formControl}>
                <TextField
                  id="restart-number"
                  label="Restart time in ms"
                  value={this.state.restartTime}
                  onChange={this.handleNumberChange.bind(this)}
                  type="number"
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl className={classes.formControl}>
                <Button variant="contained" color={this.state.audio ? 'secondary' : 'primary'} onClick={this.toggleListen}>{this.state.audio ? 'Mic Active' : this.state.micText}</Button>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl className={classes.formControl}>
                <Typography>TIMER: {this.state.timestamp}</Typography>
              </FormControl>
            </Grid>
            </Grid>
          </Paper>
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

export default withStyles(styles)(InfiniteStreaming);
