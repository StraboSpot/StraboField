import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const noteStyle = StyleSheet.create({
  container: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    flex: 1,
    padding: 10,
  },
  messageText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    padding: 15,
    textAlign: 'center',
  },
  noteContainer: {
    paddingTop: 5,
  },
});

export default noteStyle;

