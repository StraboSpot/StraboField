import {StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';

const notebookFooterStyles = StyleSheet.create({
  footerIconContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  footerIconContainerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
  },
  morePagesButton: {
    color: themes.PRIMARY_TEXT_COLOR,
  },
  morePagesDialog: {
    borderRadius: 20,
    bottom: 10,
    height: '95%',
    paddingBottom: 0,
    position: 'absolute',
    right: 10,
    width: 250,
    zIndex: 10,
  },
  morePagesListItem: {
    paddingBottom: 5,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 5,
  },
  morePagesListItemTitle: {
    color: themes.PRIMARY_TEXT_COLOR,
    flex: 1,
    fontSize: themes.SMALL_TEXT_SIZE,
    paddingLeft: 5,
    paddingRight: 5,
  },
  morePagesSectionDivider: {
    borderBottomWidth: 1,
  },
});

export default notebookFooterStyles;
