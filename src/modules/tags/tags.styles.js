import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const tagStyles = StyleSheet.create({
  overflowMenuModal: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderColor: themes.MEDIUMGREY,
    borderRadius: themes.MODAL_BORDER_RADIUS,
    borderWidth: 0.5,
    elevation: 2,
    height: 'auto',
    left: themes.SMALL_SCREEN ? undefined : themes.MAIN_MENU_WIDTH - 230,
    position: themes.SMALL_SCREEN ? null : 'absolute',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    top: themes.SMALL_SCREEN ? 0 : 10,
    width: 220,
  },
  sectionContainer: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    padding: 10,
  },
  tagCount: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  tagCountText: {
    color: themes.DARKGREY,
    fontSize: themes.SMALL_TEXT_SIZE,
  },
  // ListItem.Content aligns to flex-start, which shrinks a child to its content width, so the row is given the
  // full width to lay its chips out in and to wrap them on a narrow screen
  tagCountsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
});

export default tagStyles;

