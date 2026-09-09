import {StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';
import {SECONDARY_BACKGROUND_COLOR} from '../../../shared/styles.constants';

const notebookFooterStyles = StyleSheet.create({
  footerContainer: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderTopColor: themes.MEDIUMGREY,
    borderTopWidth: 0.5,
  },
  footerIconContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  footerIconContainerWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
  },
  morePagesButton: {
    color: themes.PRIMARY_TEXT_COLOR,
  },
  morePagesDialog: {
    backgroundColor: SECONDARY_BACKGROUND_COLOR,
    borderRadius: 20,
    bottom: 30,
    height: '95%',
    paddingBottom: 0,
    position: 'absolute',
    right: 10,
    width: 250,
    zIndex: 10,
  },
  morePagesListItem: {
    marginHorizontal: 10,
    paddingHorizontal: 0,
    paddingVertical: 5,
  },
  morePagesListItemTesting: {
    color: themes.ORANGE,
    fontSize: themes.SMALL_TEXT_SIZE,
    fontStyle: 'italic',
  },
  morePagesListItemTitle: {
    color: themes.PRIMARY_TEXT_COLOR,
    flex: 1,
    fontSize: themes.SMALL_TEXT_SIZE,
    paddingLeft: 5,
    paddingRight: 5,
  },
  morePagesSectionHeader: {
    backgroundColor: themes.PRIMARY_BACKGROUND_COLOR,
    padding: 0,
    paddingRight: 10,
  },
});

export default notebookFooterStyles;
