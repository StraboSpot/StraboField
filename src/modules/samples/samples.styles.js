import {StyleSheet} from 'react-native';

import {
  PRIMARY_ACCENT_COLOR,
  PRIMARY_ACCENT_COLOR_FADED_20,
  SECONDARY_BACKGROUND_COLOR,
  SMALL_TEXT_SIZE,
  TEXT_WEIGHT_500,
} from '../../shared/styles.constants';

const sampleStyles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: SECONDARY_BACKGROUND_COLOR,
    borderColor: PRIMARY_ACCENT_COLOR,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  actionButtonPressed: {
    backgroundColor: PRIMARY_ACCENT_COLOR_FADED_20,
  },
  actionButtonText: {
    color: PRIMARY_ACCENT_COLOR,
    fontSize: SMALL_TEXT_SIZE,
    fontWeight: TEXT_WEIGHT_500,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
  },
  listContentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default sampleStyles;
