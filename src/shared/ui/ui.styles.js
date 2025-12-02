import {Platform, StyleSheet} from 'react-native';

import {
  BLACK,
  GOLD,
  MEDIUM_TEXT_SIZE,
  MODAL_BACKDROP,
  PRIMARY_BACKGROUND_COLOR,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  sectionDivider: {
    backgroundColor: PRIMARY_BACKGROUND_COLOR,
    paddingLeft: 10,
    paddingVertical: 5,
  },
  sectionDividerSubtitle: {
    color: PRIMARY_TEXT_COLOR,
    fontSize: SMALL_TEXT_SIZE,
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
