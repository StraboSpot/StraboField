import {Platform, StyleSheet} from 'react-native';

import * as themes from './styles.constants';

const commonStyles = StyleSheet.create({
  alignItemsCenter: {
    alignItems: 'center',
  },
  buttonContainer: {
    paddingTop: 10,
  },
  buttonPadding: {
    padding: 10,
  },
  checkboxContainer: {
    backgroundColor: 'white',
    borderWidth: 0,
  },
  iconColor: {
    color: themes.BLUE,
  },
  imagePlaceholder: {
    backgroundColor: themes.MEDIUMGREY,
  },
  listItem: {
    padding: Platform.OS === 'web' ? 5 : 10,
  },
  listItemContent: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 10,
  },
  listItemFormField: {
    padding: 10,
    paddingBottom: 5,
    paddingTop: 5,
  },
  // List Styles
  listItemInverse: {
    backgroundColor: themes.PRIMARY_ACCENT_COLOR,
    padding: 10,
  },
  listItemSubtitle: {
    color: themes.DARKGREY,
    fontSize: themes.SMALL_TEXT_SIZE,
    marginTop: 5,
  },
  listItemTitle: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.PRIMARY_TEXT_SIZE,
  },
  listItemTitleInverse: {
    color: themes.SECONDARY_BACKGROUND_COLOR,
    fontSize: themes.PRIMARY_TEXT_SIZE,
  },
  noValueText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.PRIMARY_TEXT_SIZE,
    padding: 10,
    textAlign: 'center',
  },
  standardButton: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderRadius: 10,
    height: 50,
  },
  standardButtonContainer: {
    paddingBottom: 5,
    paddingTop: 5,
  },
  standardButtonText: {
    color: themes.PRIMARY_ACCENT_COLOR,
    fontSize: themes.MEDIUM_TEXT_SIZE,
  },
  standardButtonTextInverse: {
    color: themes.SECONDARY_BACKGROUND_COLOR,
    fontSize: themes.MEDIUM_TEXT_SIZE,
  },
  standardDescriptionText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.SMALL_TEXT_SIZE,
  },
  textAlignCenter: {
    textAlign: 'center',
  },
  textBold: {
    fontWeight: themes.TEXT_WEIGHT,
  },
  textInput: {
    backgroundColor: 'white',
    paddingLeft: 20,
    width: 200,
  },
  viewMapsButtonText: {
    color: themes.PRIMARY_ACCENT_COLOR,
    fontSize: themes.SMALL_TEXT_SIZE,
  },
});

export default commonStyles;
