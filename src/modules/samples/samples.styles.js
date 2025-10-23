import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const sampleStyles = StyleSheet.create({
  IGSNLogo: {
    height: 20,
    marginRight: 10,
    width: 20,
  },
  IGSNLogoSmall: {
    height: 20,
    width: 20,
  },
  listContentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoDisplayContainer: {
    borderRadius: 10,
    marginRight: 20,
  },
  mySesarUpdateDisclaimer: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default sampleStyles;
