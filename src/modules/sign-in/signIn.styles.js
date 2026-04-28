import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const styles = StyleSheet.create({
  buttonsContainer: {
    padding: 20,
  },
  errorText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
  },
  input: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderRadius: 15,
    color: 'black',
    fontSize: themes.PRIMARY_TEXT_SIZE,
    fontWeight: '500',
    height: 48,
    margin: 10,
    padding: 8,
    width: 350,
  },
  signInContainer: {
    alignItems: 'center',
  },
});

export default styles;
