import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const styles = StyleSheet.create({
  basicText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.SMALL_TEXT_SIZE,
    paddingLeft: 10,
  },
  measurementDetailSwitches: {
    borderColor: themes.PRIMARY_ACCENT_COLOR,
    borderRadius: 10,
    height: 40,
  },
  measurementsContentContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  measurementsSectionDividerButtonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: -10,
  },
  measurementsSectionDividerButtonText: {
    color: themes.PRIMARY_ACCENT_COLOR,
    fontSize: themes.MEDIUM_TEXT_SIZE,
  },
  measurementsSectionDividerContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
});

export default styles;
