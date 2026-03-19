import {Platform, StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';
import {SMALL_SCREEN} from '../../shared/styles.constants';

const homeStyles = StyleSheet.create({
  actionButtonsSmallScreenContainer: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  actionButtonsSmallScreenContainerLandscape: {
    bottom: 10,
  },
  actionButtonsSmallScreenContainerPortrait: {
    bottom: 30,
  },
  addIntervalButton: {
    position: 'absolute',
    right: SMALL_SCREEN ? 10 : 60,
    top: 10,
  },
  bottomLeftIcons: {
    bottom: 30,
    left: 10,
    position: 'absolute',
    zIndex: -1,
  },
  buttonContainer: {
    alignContent: 'center',
  },
  buttonTextAlign: {
    textAlign: 'center',
  },
  closeButtonSmallScreen: {
    left: 10,
    position: 'absolute',
    top: 10,
  },
  connectionStatusIconContainer: {
    paddingEnd: 5,
  },
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  currentZoomTextBlack: {
    color: themes.BLACK,
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: themes.LIGHTGREY,
    textShadowRadius: 10,
  },
  currentZoomTextWhite: {
    color: themes.LIGHTGREY,
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: themes.BLACK,
    textShadowRadius: 10,
  },
  drawContainer: {
    bottom: 30,
    position: 'absolute',
    right: 10,
    zIndex: -1,
  },
  drawSaveAndCancelButtons: {
    bottom: 100,
    position: 'absolute',
    right: '40%',
  },
  drawToolsContainer: {
    flexDirection: 'row',
  },
  homeIconContainer: {
    left: 10,
    position: 'absolute',
    top: 10,
  },
  iconButton: {
    top: 5,
  },
  iconSizeSmallScreen: {
    height: 40,
    marginHorizontal: -2,
  },
  imageSliderContainer: {
    alignItems: 'center',
    bottom: 20,
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 100,
  },
  mapActionsContainer: {
    bottom: 150,
    left: 10,
    position: 'absolute',
    zIndex: -1,
  },
  mapboxAttributionPosition: {
    bottom: Platform.OS === 'ios' ? 0 : 7,
    right: 10,
  },
  mapboxLogoPosition: {
    bottom: Platform.OS === 'ios' ? 0 : 7,
    left: 10,
  },
  modal: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  notebookButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  offlineMapLabelContainer: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 60,
    zIndex: -1,
  },
  offlineMapViewLabel: {
    color: 'yellow',
    fontSize: 20,
    fontWeight: 'bold',
    padding: 10,
    textShadowColor: 'black',
    textShadowRadius: 10,
  },
  shortcutButtons: {
    position: 'absolute',
    right: 10,
    top: 150,
    zIndex: -1,
  },
  smallScreenDrawActionButtons: {
    flexDirection: 'row',
    paddingLeft: 10,
  },
  smallScreenMapActionButtons: {
    borderColor: themes.MEDIUMGREY,
    borderRightWidth: 1,
    flexDirection: 'row',
    paddingRight: 10,
  },
  statusBarContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    top: 10,
    width: '100%',
    zIndex: -1,
  },
  targetDatasetContainer: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderRadius: 10,
    elevation: 2,
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 160,
  },
  toastContainer: {
    alignItems: 'center',
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    justifyContent: 'center',
  },
  toastText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.PRIMARY_TEXT_SIZE,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  urlText: {
    fontSize: themes.SMALL_TEXT_SIZE,
  },
  zoomAndScaleBarContainer: {
    bottom: 40,
    left: 100,
    position: 'absolute',
    zIndex: 1,
  },
  zoomAndScaleBarContainerSmallScreen: {
    left: 10,
    position: 'absolute',
    top: 10,
    zIndex: 1,
  },
});

export default homeStyles;
