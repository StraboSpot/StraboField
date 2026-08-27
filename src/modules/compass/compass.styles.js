import {StyleSheet} from 'react-native';

import {DIAL_SIZE} from './compass.constants';
import * as themes from '../../shared/styles.constants';

const styles = StyleSheet.create({
  buttonContainer: {
    paddingBottom: 10,
  },
  buttonTitleStyle: {
    color: themes.PRIMARY_ACCENT_COLOR,
    fontSize: 16,
  },
  cardinal: {
    color: themes.DARKGREY,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  cardinalContainer: {
    alignItems: 'center',
    height: DIAL_SIZE,
    position: 'absolute',
    width: DIAL_SIZE,
  },
  cardinalNorth: {
    color: 'red',
  },
  compassDataDirectionTextContainer: {
    flex: 1,
    marginHorizontal: 'auto',
  },
  compassDataGridContainer: {
    flex: 1,
    // marginHorizontal: 'auto',
    marginVertical: '15',
  },
  compassDataGridRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  compassImage: {
    alignItems: 'center',
    height: 175,
    justifyContent: 'center',
    width: 175,
  },
  compassImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassMatrixHeader: {
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  compassModeToggle: {
    color: themes.PRIMARY_ACCENT_COLOR,
    fontSize: 13,
    marginTop: 12,
    textDecorationLine: 'underline',
  },
  dial: {
    alignItems: 'center',
    backgroundColor: themes.WHITE,
    borderColor: themes.MEDIUMGREY,
    borderRadius: DIAL_SIZE / 2,
    borderWidth: 2,
    height: DIAL_SIZE,
    justifyContent: 'center',
    width: DIAL_SIZE,
  },
  dialWrapper: {
    alignItems: 'center',
    height: DIAL_SIZE,
    justifyContent: 'center',
    width: DIAL_SIZE,
  },
  headingText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  indexMarker: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 7,
    borderRightColor: 'transparent',
    borderRightWidth: 7,
    borderTopColor: 'red',
    borderTopWidth: 10,
    height: 0,
    position: 'absolute',
    top: -3,
    width: 0,
  },
  matrixDataButtonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  rawMeasurementDataContainer: {
    backgroundColor: themes.PRIMARY_BACKGROUND_COLOR,
  },
  rawMeasurementsTextContainer: {
    alignItems: 'flex-start',
    borderTopWidth: 0,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sliderContainer: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    justifyContent: 'center',
    padding: 10,
  },
  sliderHeading: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.PRIMARY_TEXT_SIZE - 3,
    fontWeight: 'bold',
  },
  strikeAndDipLine: {
    alignSelf: 'center',
    height: '65%',
    width: '100%',
  },
  switchText: {
    marginRight: 15,
  },
  tapHint: {
    color: themes.MEDIUMGREY,
    fontSize: 13,
    marginTop: 10,
  },
  tick: {
    backgroundColor: themes.MEDIUMGREY,
    borderRadius: 1,
    height: 6,
    marginTop: 5,
    width: 1,
  },
  tickContainer: {
    alignItems: 'center',
    height: DIAL_SIZE,
    position: 'absolute',
    top: 0,
    width: DIAL_SIZE,
  },
  tickMajor: {
    backgroundColor: themes.DARKGREY,
    height: 12,
    width: 2,
  },
  trendLine: {
    alignSelf: 'center',
    height: '65%',
    width: '100%',
  },
});

export default styles;
