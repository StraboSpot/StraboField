import {StyleSheet} from 'react-native';

import {GOLD} from '../../shared/styles.constants';

const sampleStyles = StyleSheet.create({
  listContentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  richSampleAvatar: {
    backgroundColor: GOLD,
    borderRadius: 10,
  },
});

export default sampleStyles;
