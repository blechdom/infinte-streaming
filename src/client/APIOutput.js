import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';

const styles = theme => ({
  paper: {
    flexGrow: 1,
    height: '40vh',
  	overflowY: 'scroll',
    margin: theme.spacing.unit,
    padding: theme.spacing.unit,
  },
});

class APIOutput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      name: '',
      multiline: 'Controlled',
      outputText: '',
      newText: '',
      newTranslation: '',
      concatText: '',
      isFinal: false,
      resetCount: 0,
      newJSON: {},
      newJSONString: '',

    };
  }

  componentDidMount() {
    let socket = this.props.socket;

    socket.on('getJSON', (response) => {
      let stringJSON = JSON.stringify(response, null, 4);
      this.setState({newJSON: response});
      this.setState({newJSONString: stringJSON});
    });
  }

  componentDidUpdate() {

  }

  componentWillUnmount(){
    let socket = this.props.socket;
    socket.off("getJSON");
  }

  render() {
    const { classes } = this.props;
    return (
      <div>
        <Paper elevation={1} className={classes.paper} id="api-output" ref="api-output">
          <pre>{this.state.newJSONString}</pre>
        </Paper>
      </div>
    );
  }
}

export default withStyles(styles)(APIOutput);
