import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const qaqcStyle = StyleSheet.create({
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
  qaqcContainer: {
    paddingTop: 5,
  },
});

export default qaqcStyle;
