import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const styles = StyleSheet.create({
  buttonsContainer: {
    padding: 20,
  },
  customEndpointContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  customEndpointInput: {
    borderBottomColor: 'transparent',
    fontSize: themes.MEDIUM_TEXT_SIZE,
    textAlign: 'center',
    // marginLeft: 10,
  },
  customEndpointInputContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: themes.DARKGREY,
    borderRadius: 10,
    borderWidth: 1,
    height: 45,
    marginVertical: 10,
    // width: '65%',
  },
  customEndpointText: {
    color: themes.WHITE,
    flexWrap: 'wrap',
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    marginEnd: 30,
    textAlign: 'center',
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
