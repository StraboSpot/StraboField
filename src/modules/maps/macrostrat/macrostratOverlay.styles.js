import {Dimensions, Platform, StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';
import {PRIMARY_ACCENT_COLOR, SMALL_SCREEN} from '../../../shared/styles.constants';

const platform = Platform.OS === 'ios' ? 'window' : 'screen';
const {height} = Dimensions.get(platform);

const styles = StyleSheet.create({
  attributionText: {
    fontSize: 12,
  },
  container: {
    borderRadius: themes.MODAL_BORDER_RADIUS,
    borderWidth: 0.5,
    position: 'absolute',
    right: 50,
    top: 70,
    width: 350,
  },
  containerPositionSmallScreen: {
    marginLeft: 0,
    marginRight: 0,
    paddingTop: Platform.OS === 'ios' && SMALL_SCREEN ? 30 : 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
    zIndex: 1,

  },
  contentKey: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contentText: {
    fontSize: themes.SMALL_TEXT_SIZE,
    fontWeight: 'normal',
  },
  coordsText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionContainer: {
    flex: 1,
    marginBottom: 8,
    marginHorizontal: 15,
    maxHeight: height * 0.25,
  },
  descriptionContent: {
    marginBottom: 10,
  },
  mapRefBoldText: {
    fontWeight: 'bold',
  },
  mapRefContent: {
    marginBottom: 8,
    // paddingHorizontal: 15,
  },
  showButton: {
    color: PRIMARY_ACCENT_COLOR,
    marginTop: 10,
    textAlign: 'center',
  },
  urlText: {
    color: themes.PRIMARY_ACCENT_COLOR,
  },
});

export default styles;
