import {StyleSheet} from 'react-native';

import {
  BLUE,
  DARKGREY,
  LARGE_TEXT_SIZE,
  MEDIUM_TEXT_SIZE,
  PRIMARY_BACKGROUND_COLOR,
  TEXT_WEIGHT_700,
  WHITE,
} from '../../shared/styles.constants';

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: BLUE,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: WHITE,
    fontSize: MEDIUM_TEXT_SIZE,
  },
  container: {
    backgroundColor: PRIMARY_BACKGROUND_COLOR,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  description: {
    color: DARKGREY,
    fontSize: MEDIUM_TEXT_SIZE,
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center',
  },
  header: {
    fontSize: LARGE_TEXT_SIZE,
    fontWeight: TEXT_WEIGHT_700,
    marginBottom: 16,
    textAlign: 'center',
  },
  icon: {
    marginRight: 10,
  },
});

export default styles;

