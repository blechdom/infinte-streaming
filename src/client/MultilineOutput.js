import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import { getTranscriptFromJSON, requestRestarted } from './api.js';

const styles = theme => ({
  paper: {
    flexGrow: 1,
    justifyContent: 'left',
  	overflowY: 'scroll',
    height: '30vh',
    margin: theme.spacing.unit * 2,
    padding: theme.spacing.unit * 2,
  },
  pendingText: {
    margin: theme.spacing.unit * 0.5,
    padding: theme.spacing.unit * 0.5,
    color: '#b71c1c',
    backgroundColor:'#ffcdd2',
    display: 'inline-block'
  },
  finalText: {
    margin: theme.spacing.unit * 0.5,
    padding: theme.spacing.unit * 0.5,
    color: '#1b5e20',
    backgroundColor:'#81c784',
    display: 'inline-block'
  },
  wrapperDiv: {
    display:'inline-block',
  },
  resetIndicator: {
    margin: theme.spacing.unit * 0.5,
    padding: theme.spacing.unit * 0.5,
    backgroundColor: '#ffb74d',
    color: '#ef6c00',
    display: 'inline-block'
  },

});

class MultilineOutput extends React.Component {

  constructor(props) {
    super(props);
    const { classes } = this.props;
    this.state = {
      name: '',
      multiline: 'Controlled',
      outputText: '',
      newText: '',
      concatText: '',
      isFinal: false,
      isLastNotFinal: '',
      resetCount: 0,
      transcriptList: [],
      transcriptCounter: 0,
      transcriptObject: {},
      restartCounter: 1,
    };

    getTranscriptFromJSON((err, transcriptObject) => {
      //console.log(JSON.stringify(transcriptObject, null, 4));

      this.setState({transcriptObject: transcriptObject});

      this.state.transcriptList[this.state.transcriptCounter] = transcriptObject;
      //console.log(JSON.stringify(this.state.transcriptList[this.state.transcriptCounter]));

      if (transcriptObject.isFinal){

        this.setState({transcriptCounter: this.state.transcriptCounter + 1});

      }
    });

    requestRestarted((err, restartObject) => {
      console.log('at first ' + JSON.stringify(this.state.transcriptList, null, 4));

      console.log(JSON.stringify(this.state.transcriptList[this.state.transcriptCounter], null, 4));

      if(this.state.transcriptList[this.state.transcriptCounter] && !this.state.transcriptList[this.state.transcriptCounter].isFinal){
        //console.log("last object is not final then I guess");
        this.setState({transcriptCounter: this.state.transcriptCounter + 1}, () => {
          console.log(this.state.transcriptCounter);
        });

      }

      restartObject.transcript = restartObject.transcript + ' ' + this.state.restartCounter;

      this.setState({restartCounter: this.state.restartCounter + 1});

      this.state.transcriptList[this.state.transcriptCounter] = restartObject;

      this.setState({transcriptCounter: this.state.transcriptCounter + 1});
      console.log('at last ' + JSON.stringify(this.state.transcriptList, null, 4));
    });
  }

  render() {
    const { classes } = this.props;
    const transcriptList = this.state.transcriptList;
    const transcriptDivs = transcriptList.map((transcript) => {
      let uniqueKey = transcript.startTime + transcript.transcript + transcript.endTime;
      let text =  <>{transcript.transcript}<Typography variant='caption' align='left'>time: {transcript.startTime}ms - {transcript.endTime}ms</Typography></>;
      if (transcript.isRestart){
        return( <div key={uniqueKey} className={classes.resetIndicator}>{text}</div>);
      }
      else if(transcript.isFinal){
        return( <div key={uniqueKey} className={classes.finalText}>{text}</div>);
      }
      else {
        return( <div key={uniqueKey} className={classes.pendingText}>{text}</div>);
      }
    });

    return (
      <div>
        <Paper elevation={1} className={classes.paper} id="Transcript" ref="Transcript">
          <Typography variant="subtitle1">
             {transcriptDivs}
          </Typography>
        </Paper>
      </div>
    );
  }
}

MultilineOutput.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MultilineOutput);
