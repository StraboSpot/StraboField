import {Platform, StyleSheet} from 'react-native';

import {
  BLACK,
  GOLD,
  MEDIUM_TEXT_SIZE,
  MODAL_BACKDROP,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_BACKGROUND_COLOR,
  PRIMARY_HEADER_TEXT_SIZE,
  PRIMARY_TEXT_COLOR,
  SECONDARY_BACKGROUND_COLOR,
  SMALL_TEXT_SIZE,
  WHITE,
} from '../styles.constants';

const styles = StyleSheet.create({
  accessPointIcon: {
    height: 30,
    width: 30,
  },
  alignItemsToCenter: {
    alignItems: 'center',
  },
  backButton: {
    alignItems: 'flex-start',
    marginTop: 10,
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
  batteryLevelText: {
    color: BLACK,
    fontSize: 10,
    fontWeight: 'bold',
  },
  batteryLevelTextContainer: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
    position: 'absolute',
    width: 50,
  },
  batteryStatusContainer: {
    padding: 5,
  },
  connectionStatusContainer: {
    padding: 5,
  },
  container: {
    backgroundColor: Platform.OS === 'ios' ? BLACK : WHITE,
    flex: 1,
    overflow: 'hidden',
  },
  customEndpointContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  customEndpointSwitchContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 10,
    width: '75%',
  },
  customEndpointText: {
    color: PRIMARY_TEXT_COLOR,
    fontSize: MEDIUM_TEXT_SIZE,
    marginEnd: 30,
    textAlign: 'center',
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
    width: '70%',
  },
  headerContainer: {
    alignItems: 'center',
    backgroundColor: SECONDARY_BACKGROUND_COLOR,
    height: 60,
    justifyContent: 'center',
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
  saveAndDeleteButtonContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  saveAndDeleteButtonStyles: {
    borderRadius: 15,
    paddingLeft: 20,
    paddingRight: 20,
  },
  sectionDivider: {
    backgroundColor: PRIMARY_BACKGROUND_COLOR,
    paddingLeft: 10,
    paddingVertical: 5,
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
  statusBarIcon: {
    backgroundColor: 'white',
    borderRadius: 50,
    height: 40,
    width: 40,
  },
  toastContainer: {
    alignItems: 'center',
    backgroundColor: GOLD,
    flexDirection: 'row',
    padding: 5,
  },
  verifyButtonStyle: {
    borderRadius: 15,
    paddingLeft: 20,
    paddingRight: 20,
  },
});

export default styles;
