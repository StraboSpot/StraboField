import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 30,
    margin: 10,
  },
  buttonStyle: {
    paddingLeft: 30,
    paddingRight: 30,
  },
  checkBoxText: {
    color: 'white',
  },
  input: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderRadius: 14,
    color: 'black',
    fontSize: themes.PRIMARY_TEXT_SIZE,
    fontWeight: '500',
    height: 40,
    margin: 10,
    padding: 8,
    width: 300,
  },
  inputContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  signUpContainer: {
    alignItems: 'center',
    width: '90%',
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default styles;
