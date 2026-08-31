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
  // Green wash that flashes over the face on a successful measurement grab (issue #911 visual cue).
  captureFlash: {
    backgroundColor: themes.POSITIVE_COLOR,
    left: 0,
    position: 'absolute',
    top: 0,
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
    paddingVertical: 12,
  },
  compassMatrixHeader: {
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  // Single border wrapping the control buttons and the compass face as one card.
  compassSection: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderColor: themes.MEDIUMGREY,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 10,
    marginVertical: 8,
    overflow: 'hidden',
  },
  controlRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 4,
  },
  // Fixed width so every segmented control starts at the same x and the rows line up in a column.
  controlRowLabel: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    width: 72,
  },
  // Opaque and raised above the compass (a later sibling) so the enlarged dial can never paint over
  // or steal taps from these controls — that overlap is what let a tap on a control grab a measurement.
  controlsGroup: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
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
  segmentButton: {
    borderRadius: 8,
    margin: 3,
  },
  segmentContainer: {
    backgroundColor: themes.LIGHTGREY,
    borderRadius: 10,
    borderWidth: 0,
    flex: 1,
    height: 36,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  segmentSelected: {
    backgroundColor: themes.PRIMARY_ACCENT_COLOR_FADED_40,
    borderRadius: 8,
  },
  segmentText: {
    color: themes.DARKGREY,
    fontSize: 14,
  },
  segmentTextSelected: {
    color: themes.PRIMARY_ACCENT_COLOR,
    fontSize: 14,
    fontWeight: '600',
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
