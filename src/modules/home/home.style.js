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
  // The one column holding everything above the attribution. Full width so the readouts stay at the left
  // edge and the pill stays centred however wide the pill is, and gap spaces the rows without anyone
  // having to know how tall the others are
  actionButtonsSmallScreenStack: {
    alignSelf: 'stretch',
    gap: themes.SMALL_SCREEN_MAP_STACK.GAP,
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
    alignItems: 'center',
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderRadius: 10,
    elevation: 3,
    flexDirection: 'row',
    paddingHorizontal: 10,
    shadowColor: themes.BLACK,
    shadowOffset: {height: 2, width: 0},
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
  // DrawInfo shares a row with the readouts on the left so that it sits directly above the draw tools at
  // the right of the pill, rather than a row further up
  drawInfoSmallScreen: {
    paddingRight: themes.SMALL_SCREEN_MAP_STACK.EDGE_INSET,
  },
  drawSaveAndCancelButtons: {
    bottom: 100,
    position: 'absolute',
    right: '40%',
  },
  drawToolsContainer: {
    alignItems: 'center',
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
  // Tightens the row of map buttons and closes the pill up around them: the icons carry a wide band of
  // transparent padding, so their ink is only about 25 of the 55 they draw at. Taking that out of the
  // layout leaves the icon drawing full size and still a 55 point touch target. Goes on the Pressable,
  // never on the icon - rn-vui's Image also hands that style to the child sizing its overflow-hidden
  // container, so a negative margin there shaves the sides off the icon instead
  iconSpacingSmallScreen: {
    marginHorizontal: -2,
    marginVertical: -7,
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
  mapActionsPill: {
    alignItems: 'center',
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderColor: themes.MEDIUMGREY,
    borderRadius: 10,
    borderWidth: 0.5,
    elevation: 2,
    flexDirection: 'row',
    // The buttons are laid out tighter than they draw, so they reach past the pill. Android clips a
    // rounded background's children unless told not to, and clipping them is the whole problem
    overflow: 'visible',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mapActionsPillRow: {
    alignItems: 'center',
  },
  // The row directly above the pill: the readouts on the left, DrawInfo on the right. flex-end sits them
  // both on the pill rather than leaving DrawInfo floating when the readouts are taller
  mapReadoutsRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // The scale bar, the zoom and the geolocate button above them, all held to the left edge
  mapReadoutsSmallScreen: {
    alignItems: 'flex-start',
    gap: themes.SMALL_SCREEN_MAP_STACK.GAP,
    paddingLeft: themes.SMALL_SCREEN_MAP_STACK.EDGE_INSET,
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
  // The divider sits on the draw tools, not the map actions, so it goes away when they do
  smallScreenDrawActionButtons: {
    borderColor: themes.MEDIUMGREY,
    borderLeftWidth: 1,
    flexDirection: 'row',
    paddingLeft: 10,
  },
  smallScreenMapActionButtons: {
    flexDirection: 'row',
    paddingRight: 10,
  },
  statusBarContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    top: 3,
    width: '100%',
    zIndex: -1,
  },
  statusBarDivider: {
    alignSelf: 'stretch',
    backgroundColor: themes.MEDIUMGREY,
    marginHorizontal: 8,
    marginVertical: 6,
    width: StyleSheet.hairlineWidth,
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
