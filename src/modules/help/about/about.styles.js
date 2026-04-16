import {StyleSheet} from 'react-native';

import {LARGE_TEXT_SIZE, MEDIUM_TEXT_SIZE} from '../../../shared/styles.constants';

const styles = StyleSheet.create({
  bold: {
    fontWeight: '600',
  },
  buildText: {
    fontSize: MEDIUM_TEXT_SIZE,
    paddingBottom: 10,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  heading: {
    fontSize: LARGE_TEXT_SIZE,
    marginBottom: 8,
    marginTop: 10,
  },
  paragraph: {
    fontSize: MEDIUM_TEXT_SIZE,
    lineHeight: 22,
    marginBottom: 24,
  },
  versionText: {
    fontSize: LARGE_TEXT_SIZE,
    paddingBottom: 5,
  },
});

export default styles;
