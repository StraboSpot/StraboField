import {Platform, StyleSheet} from 'react-native';

import * as themes from '../styles.constants';

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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 50,
  },
  batteryLevelText: {
    color: themes.BLACK,
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
  buttonText: {
    color: themes.PRIMARY_ACCENT_COLOR,
    fontSize: themes.PRIMARY_HEADER_TEXT_SIZE,
  },
  connectionStatusContainer: {
    padding: 5,
  },
  container: {
    backgroundColor: Platform.OS === 'ios' ? themes.BLACK : themes.WHITE,
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
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.MEDIUM_TEXT_SIZE,
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
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    height: 60,
    justifyContent: 'center',
  },
  imageIcon: {
    height: Platform.OS === 'web' ? 50 : 55,
    width: Platform.OS === 'web' ? 50 : 55,
  },
  itemSeparator: {
    borderColor: themes.LIGHTGREY,
    borderTopWidth: 1,
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 10,
  },
  littleSpacer: {
    padding: 5,
  },
  navButtonsContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    flexShrink: 1,
    paddingLeft: 10,
    paddingTop: 10,
  },
  sectionDividerText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    paddingBottom: 5,
  },
  sectionDividerWithButtonContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeaderBackground: {
    backgroundColor: themes.PRIMARY_BACKGROUND_COLOR,
  },
  slider: {
    width: '100%',
  },
  sliderLabel: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.SMALL_TEXT_SIZE,
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
    backgroundColor: themes.GOLD,
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
