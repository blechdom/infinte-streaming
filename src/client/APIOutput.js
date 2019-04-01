import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import { getJSON } from './api.js';

const styles = theme => ({
  paper: {
    flexGrow: 1,
    height: '40vh',
  	overflowY: 'scroll',
    margin: theme.spacing.unit * 2,
    padding: theme.spacing.unit * 2,
  },
});

class APIOutput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      newJSON: {},
      newJSONString: '',

    };
    getJSON((err, newJSON) => {
      let stringJSON = JSON.stringify(newJSON, null, 4);
      this.setState({
        newJSON: newJSON,
        newJSONString: stringJSON
      });
    });
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
