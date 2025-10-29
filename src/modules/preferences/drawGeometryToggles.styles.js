import {Platform, StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';

const drawGeometryTogglesStyles = StyleSheet.create({
  buttonGroupText: {
    color: PRIMARY_ACCENT_COLOR,
    paddingHorizontal: 5,
    textAlign: 'center',
  },
  drawGeometryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  drawGeometrySwitch: {
    borderColor: themes.PRIMARY_ACCENT_COLOR,
    borderRadius: 10,
    flex: 1,
    height: Platform.OS === 'web' ? 30 : 40,
  },
  selectedButton: {
    backgroundColor: PRIMARY_ACCENT_COLOR,
  },
});

export default drawGeometryTogglesStyles;
