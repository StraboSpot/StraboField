import {StyleSheet} from 'react-native';

import {LARGE_TEXT_SIZE} from '../../shared/styles.constants';

const styles = StyleSheet.create({
  bold: {
    fontWeight: '600',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: 15,
  },
  content: {
    padding: 16,
  },
  descriptionContainer: {
    // backgroundColor: '#fff',
    // flex: 1,
  },
  heading: {
    // color: '#2b2b2b',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  paragraph: {
    // color: '#444',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  versionText: {
    fontSize: LARGE_TEXT_SIZE,
  },
});

export default styles;
