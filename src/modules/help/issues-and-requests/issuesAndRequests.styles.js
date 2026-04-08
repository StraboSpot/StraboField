import {StyleSheet} from 'react-native';

import {DARKGREY, LARGE_TEXT_SIZE, MEDIUM_TEXT_SIZE, TEXT_WEIGHT_700} from '../../../shared/styles.constants';

const issuesAndRequestsStyles = StyleSheet.create({
  container: {
    flex: 1,
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
});

export default issuesAndRequestsStyles;
