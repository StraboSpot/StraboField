import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';
import {MEDIUMGREY, SECONDARY_BACKGROUND_COLOR} from '../../shared/styles.constants';

const styles = StyleSheet.create({
  buttons: {
    color: themes.PRIMARY_ACCENT_COLOR,
    paddingLeft: 10,
    paddingRight: 10,
  },
  container: {
    backgroundColor: SECONDARY_BACKGROUND_COLOR,
    borderRightColor: MEDIUMGREY,
    borderRightWidth: 2,
    flex: 1,
  },
  documentListItem: {
    borderRadius: 15,
    margin: 5,
  },
  headerText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.LARGE_TEXT_SIZE,
    fontWeight: 'bold',
  },
  mainMenuHeaderContainer: {
    flexDirection: 'row',
    height: 80,
    padding: 10,
  },
  mainMenuIconContainer: {
    justifyContent: 'center',
  },
  settingsDrawer: {
    height: '100%',
    left: 0,
    position: 'absolute',
    width: 300,
    zIndex: 0,
  },
  subheaderText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.PRIMARY_TEXT_SIZE,
    fontWeight: 'bold',
  },
});

export default styles;
