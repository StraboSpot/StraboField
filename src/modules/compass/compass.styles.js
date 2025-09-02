import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const styles = StyleSheet.create({
  buttonContainer: {
    paddingBottom: 10,
  },
  buttonTitleStyle: {
    color: themes.PRIMARY_ACCENT_COLOR,
    fontSize: 16,
  },
  compassContainer: {
    // backgroundColor: 'red',
  },
  compassDataCol1: {
    flex: 1,
  },
  compassDataCol2: {
    borderWidth: 1,
    flex: 1,
  },
  compassDataCol3: {
    flex: 1,
  },
  compassDataDirectionTextContainer: {
    flex: 1,

    // flexDirection: 'row',
    // justifyContent: 'space-evenly',
    marginHorizontal: 'auto',
    // paddingBottom: 10,
    // paddingLeft: 10,
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
  compassDataModalPosition: {
    position: 'absolute',
    // top: 20,
  },
  compassImage: {
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
  trendLine: {
    alignSelf: 'center',
    height: '65%',
    width: '100%',
  },
});

export default styles;
