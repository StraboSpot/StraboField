import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';
import {WHITE} from '../../shared/styles.constants';

const sketchStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: WHITE,
    justifyContent: 'center',
  },
  functionButton: {
    alignItems: 'center',
    backgroundColor: themes.BLUE,
    borderRadius: 5,
    height: 30,
    justifyContent: 'center',
    marginHorizontal: 10,
    marginVertical: 20,
    width: 60,
  },
  strokeColorButton: {
    borderRadius: 50,
    height: 50,
    marginHorizontal: 2.5,
    marginVertical: 20,
    width: 50,
  },
  strokeWidthButton: {
    alignItems: 'center',
    backgroundColor: themes.BLUE,
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    marginHorizontal: 2.5,
    marginVertical: 20,
    width: 30,
  },
  warningText: {
    color: themes.WARNING_COLOR,
  },
});

export default sketchStyles;
