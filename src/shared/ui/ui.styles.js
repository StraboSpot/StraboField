import {Platform, StyleSheet} from 'react-native';

import {
  BLACK,
  DARKGREY,
  GOLD,
  LIST_BORDER_COLOR,
  MEDIUM_TEXT_SIZE,
  MODAL_BACKDROP,
  PRIMARY_BACKGROUND_COLOR,
  PRIMARY_TEXT_COLOR,
  SECONDARY_BACKGROUND_COLOR,
  SMALL_TEXT_SIZE,
  WHITE,
} from '../styles.constants';

const styles = StyleSheet.create({
  alignItemsToCenter: {
    alignItems: 'center',
  },
  backdrop: {
    backgroundColor: MODAL_BACKDROP,
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 50,
  },
  container: {
    backgroundColor: Platform.OS === 'ios' ? BLACK : WHITE,
    flex: 1,
    overflow: 'hidden',
  },
  customEndpointContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  customEndpointInput: {
    borderBottomColor: 'transparent',
    fontSize: MEDIUM_TEXT_SIZE,
    textAlign: 'center',
  },
  customEndpointInputContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: DARKGREY,
    borderRadius: 10,
    borderWidth: 1,
    height: 45,
    marginVertical: 10,
  },
  customEndpointSwitchContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customEndpointText: {
    color: PRIMARY_TEXT_COLOR,
    fontSize: MEDIUM_TEXT_SIZE,
  },
  customEndpointVerifyButtonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 10,
  },
  customEndpointVerifyIconContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  customEndpointVerifyInputContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalLine: {
    borderBottomColor: LIST_BORDER_COLOR,
    borderBottomWidth: 1,
  },
  imageIcon: {
    height: Platform.OS === 'web' ? 50 : 55,
    width: Platform.OS === 'web' ? 50 : 55,
  },
  itemSeparator: {
    borderColor: PRIMARY_BACKGROUND_COLOR,
    borderTopWidth: 1,
  },
  littleSpacer: {
    padding: 5,
  },
  sectionDivider: {
    backgroundColor: PRIMARY_BACKGROUND_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  // The same treatment a survey note gets in Form, which is the same kind of text: an explanation of the fields
  // under it rather than one of them
  sectionDividerSubtitle: {
    color: PRIMARY_TEXT_COLOR,
    fontSize: SMALL_TEXT_SIZE,
    fontStyle: 'italic',
  },
  sectionDividerText: {
    color: PRIMARY_TEXT_COLOR,
    fontSize: MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
  },
  sectionDividerWithButtonContainer: {
    alignItems: 'flex-end',
    backgroundColor: PRIMARY_BACKGROUND_COLOR,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeaderBackground: {
    backgroundColor: SECONDARY_BACKGROUND_COLOR,
  },
  slider: {
    width: '100%',
  },
  sliderLabel: {
    color: PRIMARY_TEXT_COLOR,
    fontSize: SMALL_TEXT_SIZE,
  },
  sliderTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spacer: {
    padding: 10,
  },
  toastContainer: {
    alignItems: 'center',
    backgroundColor: GOLD,
    flexDirection: 'row',
    padding: 5,
  },
});

export default styles;
