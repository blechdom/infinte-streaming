import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import SpeechAPIVisualizer from './SpeechAPIVisualizer';

const styles = (theme) => ({
  root: {
    flexGrow: 1,
    height: '100%',
    width: '100%',
  },
  layout: {
    width: 'auto',
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  [theme.breakpoints.up('100%' + theme.spacing.unit * 2)]: {
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
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
            <React.Fragment>
              <div className={classes.form}>
                <SpeechAPIVisualizer />
              </div>
            </React.Fragment>
        </main>
      </React.Fragment>
    );
  }
}

TranslationDemo.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TranslationDemo);
