import {Dimensions, Platform, StyleSheet} from 'react-native';

// Constants
import * as themes from '../../shared/styles.constants';
import {SECONDARY_BACKGROUND_COLOR} from '../../shared/styles.constants';

const platform = Platform.OS === 'ios' ? 'window' : 'screen';
const {height} = Dimensions.get(platform);

const styles = StyleSheet.create({
  dropdownContainer: {
    marginBottom: -5,
    marginTop: -5,
    paddingBottom: 0,
    paddingTop: 0,
  },
  dropdownIndicator: {
    fontSize: 20,
  },
  dropdownInputGroup: {
    paddingLeft: 0,
  },
  dropdownItemsContainer: {
    backgroundColor: SECONDARY_BACKGROUND_COLOR,
    borderWidth: 0.5,
  },
  dropdownSelectedContainer: {
    borderBottomWidth: 0,
    paddingBottom: 0, //Overrides default
    paddingTop: 0, //Overrides default
  },
  dropdownSelectionListHeader: {
    fontSize: themes.PRIMARY_TEXT_SIZE,
    marginLeft: -15,
    marginRight: -20,
    padding: 0,
  },
  dropdownTagContainer: {
    borderRadius: 5,
    borderWidth: 0.5,
    margin: 1,
  },
  fieldError: {
    color: themes.WARNING_COLOR,
    textAlign: 'center',
  },
  fieldLabel: {
    alignSelf: 'center',
    color: themes.PRIMARY_TEXT_COLOR,
    flex: 1,
    fontSize: themes.PRIMARY_TEXT_SIZE,
    fontWeight: 'bold',
    paddingBottom: 2.5,
    paddingTop: 2.5,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  fieldValue: {
    borderBottomColor: themes.MEDIUMGREY,
    borderBottomWidth: 0.5,
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.PRIMARY_TEXT_SIZE,
    padding: 5,
    width: '100%',
  },
  fieldValueFill: {
    borderColor: themes.MEDIUMGREY,
    borderWidth: 0.5,
    flex: 1,
    minHeight: 75,
    verticalAlign: 'top',
  },
  fieldValueFull: {
    borderColor: themes.MEDIUMGREY,
    borderWidth: 0.5,
    maxHeight: height * 0.5,
    minHeight: height * 0.5,
    verticalAlign: 'top',
  },
  fieldValueMultiline: {
    borderColor: themes.MEDIUMGREY,
    borderWidth: 0.5,
    height: 75,
    verticalAlign: 'top',
  },
  formButton: {
    borderColor: themes.MEDIUMGREY,
    borderRadius: 5,
    borderWidth: 0.75,
    height: 60,
    width: '100%',
  },
  formButtonLarge: {
    borderColor: themes.MEDIUMGREY,
    borderRadius: 5,
    borderWidth: 0.75,
    height: 80,
    width: '100%',
  },
  formButtonSelectedTitle: {
    color: themes.WHITE,
    fontSize: themes.SMALL_TEXT_SIZE,
    fontWeight: '400',
  },
  formButtonSmall: {
    borderColor: themes.MEDIUMGREY,
    borderRadius: 5,
    borderWidth: 0.75,
    height: 40,
    width: '100%',
  },
  formButtonTitle: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.SMALL_TEXT_SIZE,
  },
  fullWidthButtonContainer: {
    padding: 10,
    paddingBottom: 2.5,
    paddingTop: 2.5,
  },
  halfWidthButtonContainer: {
    padding: 2,
    width: '50%',
  },
  halfWidthButtonsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingBottom: 2.5,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 2.5,
  },
  // Stacks the label above the radio/checkbox rather than beside it
  horizontalChoiceCompact: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 2.5,
  },
  // Trims the CheckBox's default side margins (10 each) so more choices fit on a row
  horizontalChoiceContainer: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderWidth: 0,
    marginHorizontal: 0,
    marginVertical: 2.5,
    padding: 1,
  },
  // The CheckBox title defaults to bold and its own grey, so match the label of the other choice layouts
  horizontalChoiceTitle: {
    fontWeight: 'normal',
    marginLeft: 5,
    marginRight: 5,
  },
  horizontalChoices: {
    width: '100%',  // ListItem.Content aligns children to flex-start, so shrinks them to their content width
  },
  horizontalChoicesRow: {
    flexDirection: 'row',
  },
  horizontalChoicesSpread: {
    justifyContent: 'space-between',
  },
  horizontalChoicesUnmeasured: {
    flexWrap: 'wrap',  // Only until the choices have been measured and laid out in columns
  },
});
export default styles;
