import {StyleSheet} from 'react-native';

import {
  MEDIUM_TEXT_SIZE,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_TEXT_COLOR,
  SECONDARY_BACKGROUND_COLOR,
} from '../../styles.constants';

const buttonStyles = StyleSheet.create({
  buttonGroupContainer: {
    borderRadius: 10,
    minHeight: 60,
  },
  buttonGroupText: {
    color: PRIMARY_TEXT_COLOR,
    fontSize: MEDIUM_TEXT_SIZE,
    textAlign: 'center',
  },
  navButtonsContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  standardButton: {
    borderRadius: 10,
  },
  standardButtonContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  standardButtonText: {
    color: PRIMARY_ACCENT_COLOR,
    fontSize: MEDIUM_TEXT_SIZE,
  },
  standardButtonTextInverse: {
    color: SECONDARY_BACKGROUND_COLOR,
    fontSize: MEDIUM_TEXT_SIZE,
  },
});

export default buttonStyles;
