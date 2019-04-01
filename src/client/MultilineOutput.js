import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import Divider from '@material-ui/core/Divider';

const styles = theme => ({
  paper: {
    flexWrap: 'nowrap',
    width: '100%',
  	overflowX: 'scroll',
    margin: theme.spacing.unit,
    padding: theme.spacing.unit,
  },
  pendingText: {
    margin: theme.spacing.unit,
    padding: theme.spacing.unit,
    color: '#ef9a9a',
    backgroundColor:'#e3f2fd',
    display: 'inline-block'

  },
  finalText: {
    margin: theme.spacing.unit,
    padding: theme.spacing.unit,
    backgroundColor:'#ef9a9a',
    display: 'inline-block'
  },
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    },
    gridList: {
      flexWrap: 'nowrap',
      transform: 'translateZ(0)',
      justify: 'left',
      width: '100%'
    },
    wrapperDiv: {
      display:'inline-block'
    },
    title: {
      color: theme.palette.primary.light,
    },
});

class MultilineOutput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      name: '',
      multiline: 'Controlled',
      outputText: '',
      newText: '',
      concatText: '',
      isFinal: false,
      resetCount: 0,
      transcriptList: [],
      transcriptCounter: 0,
    };
  }

  componentDidMount() {
    const { classes } = this.props;
    let socket = this.props.socket;

    socket.on('getTranscript', (response) => {
      this.state.transcriptList[this.state.transcriptCounter] = {
        transcript: response.transcript,
      };
      if(response.isfinal){
        console.log("is final");
        this.setState({transcriptCounter: this.state.transcriptCounter + 1});
      }

      console.log("transcript counter is " + this.state.transcriptCounter);



      this.setState({newText: response.transcript});
      if (this.state.newText != undefined){
        this.setState({outputText: <div className={classes.wrapperDiv}>{this.state.concatText} <div className={classes.pendingText}>{this.state.newText}</div></div>});
        if (response.isfinal){
          console.log("IS FINAL");
          this.setState({
            isFinal: true,
            concatText: <div className={classes.wrapperDiv}>{this.state.concatText} <div className={classes.finalText}>{this.state.newText}</div></div>,
          }, () => {
            this.setState({outputText: <div className={classes.wrapperDiv}>{this.state.concatText}</div>});
          });
        }
      }
    });
    socket.on('resetStreamOccurred', (data) => {
      console.log("stream reset");
      this.setState({
          concatText:
            <div>
              {this.state.concatText}
              <Typography variant='caption' justify='center'>Request Restarted</Typography>
              <Divider />
            </div>,
      }, () => {
        this.setState({outputText: <div>{this.state.concatText}</div>});
      });
    });

    //this.scrollToRight();
  }

  scrollToRight = () => {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }

  componentDidUpdate() {
    this.scrollToRight();
  }

  componentWillUnmount(){
    let socket = this.props.socket;
    socket.off("getTranscript");
    socket.off("getTranslation");
    socket.off("getJSON");
  }

  componentWillReceiveProps(props){
    console.log("in render props: " + this.props.reset + " and state: " + this.state.resetCount);
    if(this.props.reset!=this.state.resetCount){
      console.log("multiline-reset");
      this.setState({
        outputText:'',
        concatText:'',
        resetCount: this.props.reset
      });
    }
  }
  render() {
    const { classes } = this.props;

    return (
      <div>
       <div className={classes.root}>
            <GridList className={classes.gridList} cols={2.5}>
              {this.state.transcriptList.map(tile => (
                <GridListTile key={tile.transcript}>
                  <Typography>{tile.transcript}</Typography>
                </GridListTile>
              ))}
            </GridList>
          </div>
        <Paper elevation={1} className={classes.paper} id="Transcript" ref="Transcript">
          <Typography variant="h6">
            {this.state.outputText}
             <div style={{ float:"left", clear: "both" }} ref={(el) => { this.messagesEnd = el; }}>
             </div>
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
