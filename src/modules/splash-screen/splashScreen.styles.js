import {Platform, StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';
import {PRIMARY_TEXT_SIZE} from '../../shared/styles.constants';

const shadow = Platform.OS === 'web' ? {textShadow: '0 0 10px white'}
  : {textShadowColor: 'white', textShadowRadius: 10};

const splashScreenStyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  buildNumberText: {
    bottom: 20,
    color: 'white',
    fontSize: 14,
    position: 'absolute',
    right: 20,
    ...shadow,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 70,
  },
  dimensionsContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  dimensionsText: {
    color: 'white',
    fontSize: PRIMARY_TEXT_SIZE,
    fontWeight: 'bold',
  },
  loadingSplashScreenText: {
    fontSize: themes.LARGE_TEXT_SIZE,
    fontWeight: themes.TEXT_WEIGHT_500,
    padding: 50,
  },
  title: {
    color: 'black',
    ...shadow,
  },
  titleContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  versionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionNumberText: {
    color: 'black',
    fontFamily: 'ChalkboardSE-Bold',
    fontSize: 25,
    marginRight: 10,
    textAlign: 'right',
    // marginBottom: 10,
    ...shadow,
  },
  wifiIndicatorContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    position: 'absolute',
    right: 10,
    top: 10,
  },
});

export default splashScreenStyles;
