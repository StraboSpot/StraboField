import {Dimensions, Platform, StyleSheet} from 'react-native';

// Constants
import * as themes from '../../shared/styles.constants';
import {PRIMARY_BACKGROUND_COLOR} from '../../shared/styles.constants';

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
    backgroundColor: PRIMARY_BACKGROUND_COLOR,
    paddingLeft: 0,
  },
  dropdownSelectedContainer: {
    backgroundColor: PRIMARY_BACKGROUND_COLOR,
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
  },
  fieldValue: {
    backgroundColor: themes.PRIMARY_BACKGROUND_COLOR,
    borderBottomColor: themes.MEDIUMGREY,
    borderBottomWidth: 0.5,
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.PRIMARY_TEXT_SIZE,
    padding: 5,
    width: '100%',
  },
  fieldValueFull: {
    maxHeight: height * 0.5,
    minHeight: height * 0.5,
    verticalAlign: 'top',
  },
  fieldValueMultiline: {
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
});
export default styles;
