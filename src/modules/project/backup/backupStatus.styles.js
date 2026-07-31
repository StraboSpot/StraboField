import {StyleSheet} from 'react-native';

import {SMALL_SCREEN, SECONDARY_BACKGROUND_COLOR} from '../../../shared/styles.constants';

const backupStatusStyles = StyleSheet.create({
  backupStatusContainer: {
    alignItems: 'center',
    backgroundColor: SECONDARY_BACKGROUND_COLOR,
    flexDirection: 'row',
    gap: SMALL_SCREEN ? 0 : 4,
    paddingEnd: SMALL_SCREEN ? 0 : 5,
  },
  saveAlertIconContainer: {
    alignItems: 'center',
    borderRadius: 50,
    height: 40,
    justifyContent: 'center',
    width: SMALL_SCREEN ? 30 : 40,
  },
});

export default backupStatusStyles;
