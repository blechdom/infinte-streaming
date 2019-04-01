import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Translator from './Translator';

const styles = (theme) => ({
  root: {
    flexGrow: 1,
    height: '100%',
  },
  title: {
    padding: theme.spacing.unit * 2,
    color: 'white',
  },
  layout: {
    width: 'auto',
    marginLeft: theme.spacing.unit * 2,
    marginRight: theme.spacing.unit * 2,
    [theme.breakpoints.up(720 + theme.spacing.unit * 2 * 2)]: {
      width: 720,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
    [theme.breakpoints.up(720 + theme.spacing.unit * 3 * 2)]: {
      marginTop: theme.spacing.unit * 6,
      marginBottom: theme.spacing.unit * 6,
    },
  },
  form: {
    padding: theme.spacing.unit * 2,
    [theme.breakpoints.up(720 + theme.spacing.unit * 3 * 2)]: {
      padding: theme.spacing.unit * 3,
    },
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    marginTop: theme.spacing.unit * 3,
    marginLeft: theme.spacing.unit,
  },
});


class TranslationDemo extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {classes} = this.props;

    return (
      <React.Fragment>
        <CssBaseline />
        <main className={classes.layout}>
          <Paper className={classes.paper}>
            <AppBar position="static">
              <Typography component="h1" variant="h4" className={classes.title} align="center">
                Speech-to-Speech Translation
              </Typography>
            </AppBar>
            <React.Fragment>
              <div className={classes.form}>
                <Translator />
              </div>
            </React.Fragment>
          </Paper>
        </main>
      </React.Fragment>
    );
  }
}

TranslationDemo.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TranslationDemo);
