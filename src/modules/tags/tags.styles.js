import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const tagStyles = StyleSheet.create({
  listText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: 12,
  },
  menuDialog: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderColor: themes.MEDIUMGREY,
    borderRadius: themes.MODAL_BORDER_RADIUS,
    borderWidth: 0.5,
    elevation: 2,
    height: 'auto',
    position: themes.SMALL_SCREEN ? null : 'absolute',
    right: themes.SMALL_SCREEN ? 0 : 10,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    top: themes.SMALL_SCREEN ? 0 : 10,
    width: 220,
  },
  sectionContainer: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    padding: 10,
  },
});

export default tagStyles;

