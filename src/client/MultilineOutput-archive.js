import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import { getTranscriptFromJSON } from './api.js';

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
      restartCounter: 0,
    };

    getTranscriptFromJSON((err, transcriptObject) => {
      console.log(JSON.stringify(transcriptObject, null, 4));

      this.setState({transcriptObject: transcriptObject});

      this.state.transcriptList[this.state.transcriptCounter] = transcriptObject;
      console.log(JSON.stringify(this.state.transcriptList[this.state.transcriptCounter]));

      if (transcriptObject.transcript != undefined){

        this.setState({
          outputText:
            <div>
              {this.state.concatText}
              <div className={classes.pendingText}>
                {transcriptObject.transcript}
              </div>
            </div>
        });

        if (transcriptObject.isFinal){

          this.setState({transcriptCounter: this.state.transcriptCounter + 1});

          this.setState({
            concatText:
              <div className={classes.wrapperDiv}>
                {this.state.concatText}
                <div className={classes.finalText}>
                  {transcriptObject.transcript}
                </div>
              </div>,
          }, () => {
            this.setState({outputText: <div>{this.state.concatText}</div>});
          });
        }
      }




    });
  }

  componentDidMount() {
    const { classes } = this.props;
    let socket = this.props.socket;

    socket.on('resetStreamOccurred', (data) => {
      console.log("last object " + JSON.stringify(this.state.transcriptList[this.state.transcriptCounter-1]));
      if(!this.state.transcriptList[this.state.transcriptCounter-1].isFinal){
        console.log("last object not final then I guess");
        this.setState({transcriptCounter: this.state.transcriptCounter + 1});
      }
      this.setState({restartCounter: this.state.restartCounter + 1});
      let restartObject = {
        transcript: 'Restart ' + this.state.restartCounter,
        ifFinal: true,
        startTime: null,
        endTime: null,
        isRestart: true,
      };
      this.state.transcriptList[this.state.transcriptCounter] = restartObject;
      this.setState({transcriptCounter: this.state.transcriptCounter + 1});

      //console.log("stream reset");
/*      this.setState({
          concatText:
            <div className={classes.wrapperDiv}>
              {this.state.concatText}
              <div className={classes.resetIndicator}>
                <Typography variant='h6'>Restart</Typography>
              </div>
            </div>,
      }, () => {
        this.setState({outputText: <div>{this.state.concatText}</div>});
      });*/
    });
  }

  render() {
    const { classes } = this.props;

    return (
      <div>
        <Paper elevation={1} className={classes.paper} id="Transcript" ref="Transcript">
          <Typography variant="h6">
            {this.state.outputText}
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
