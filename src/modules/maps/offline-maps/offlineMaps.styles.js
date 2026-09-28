import {StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';

const styles = StyleSheet.create({
  itemContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  // Takes the width the controls leave, so the whole line opens the rename modal rather than the text alone
  nameContainer: {
    flex: 1,
    marginLeft: 10,
  },
  // What is wrong with a row is said in its subtitle; the color is only there to draw the eye to it
  noTilesText: {
    color: themes.WARNING_COLOR,
  },
  // Gold rather than the accent color: this paints over map imagery, where blue loses against water and terrain
  previewBanner: {
    alignItems: 'center',
    backgroundColor: themes.GOLD,
    borderColor: themes.MEDIUMGREY,
    borderRadius: 10,
    borderWidth: 0.5,
    elevation: 2,
    paddingHorizontal: 15,
    paddingVertical: 8,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  previewBannerContainer: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 60,
    zIndex: -1,
  },
  previewBannerSubText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.SMALL_TEXT_SIZE,
  },
  previewBannerText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: themes.TEXT_WEIGHT_700,
  },
  // A row is two short lines of text, so the button's standard 10px of container padding above and below
  // is what sets the row height rather than its contents. The button keeps its own internal padding.
  previewButtonContainer: {
    paddingVertical: 0,
  },
  // The accent color is the only thing saying a name can be tapped to rename it
  renameableTitle: {
    color: themes.PRIMARY_ACCENT_COLOR,
  },
});

export default styles;
