import {StyleSheet} from 'react-native';

import {
  PRIMARY_ACCENT_COLOR_FADED_20,
  PRIMARY_TEXT_COLOR,
  SMALL_TEXT_SIZE,
} from '../../shared/styles.constants';

const sampleStyles = StyleSheet.create({
  infoCallout: {
    alignItems: 'flex-start',
    backgroundColor: PRIMARY_ACCENT_COLOR_FADED_20,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    margin: 10,
    padding: 12,
  },
  infoCalloutText: {
    color: PRIMARY_TEXT_COLOR,
    flex: 1,
    fontSize: SMALL_TEXT_SIZE,
    lineHeight: 20,
  },
  listContentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default sampleStyles;
