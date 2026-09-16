import {Platform, StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';

const drawGeometryTogglesStyles = StyleSheet.create({
  buttonGroupText: {
    color: PRIMARY_ACCENT_COLOR,
    flexShrink: 1,
    flexWrap: 'wrap',
    fontSize: themes.SMALL_TEXT_SIZE,
    paddingHorizontal: 3,
    textAlign: 'center',
  },
  drawGeometryRow: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  drawGeometrySwitch: {
    borderColor: themes.PRIMARY_ACCENT_COLOR,
    borderRadius: 10,
    flex: 1,
    height: Platform.OS === 'web' ? 35 : 45,
  },
  selectedButton: {
    backgroundColor: PRIMARY_ACCENT_COLOR,
  },
});

export default drawGeometryTogglesStyles;
