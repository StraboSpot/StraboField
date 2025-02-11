import {Platform, StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';
import {SMALL_SCREEN} from '../../../shared/styles.constants';

const styles = StyleSheet.create({
  animationContainer: {
    height: 150,
    marginBottom: 20,
  },
  backdropStyles: {
    backgroundColor: 'transparent',
  },
  baseMapPosition: {
    bottom: SMALL_SCREEN ? 70 : 40,
    left: SMALL_SCREEN ? 10 : 75,
    position: 'absolute',
  },
  buttonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: 10,
  },
  buttonText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.PRIMARY_TEXT_SIZE,
  },
  closeButton: {
    alignItems: 'flex-end',
  },
  contentText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    padding: 5,
    textAlign: 'center',
  },
  customBaseMapListContainer: {
    backgroundColor: themes.PRIMARY_BACKGROUND_COLOR,
    paddingBottom: 10,
    paddingTop: 10,
  },
  disabledButtonText: {
    color: themes.PRIMARY_TEXT_COLOR,
  },
  importantText: {
    color: 'red',
    fontWeight: themes.TEXT_WEIGHT,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: themes.PRIMARY_BACKGROUND_COLOR,
    borderWidth: 1,
  },
  mapActionsPosition: {
    bottom: SMALL_SCREEN ? 10 : 100,
    left: SMALL_SCREEN ? 10 : 75,
    position: 'absolute',
  },
  mapSymbolsPosition: {
    bottom: SMALL_SCREEN ? 10 : 100,
    left: SMALL_SCREEN ? 10 : 75,
    position: 'absolute',
  },
  overlayContainer: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderColor: themes.MEDIUMGREY,
    borderRadius: themes.MODAL_BORDER_RADIUS,
    borderWidth: 0.5,
    elevation: 2,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 300,
  },
  overlayContainerFullScreen: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    overflow: 'hidden',
    paddingTop: Platform.OS === 'ios' && SMALL_SCREEN ? 30 : 0,
    zIndex: 1,
  },
  overlayContent: {
    alignItems: 'center',
    marginTop: 5,
  },
  overlayPosition: {
    bottom: 60,
    left: 70,
    position: 'absolute',
  },
  selectGeometryTypeContent: {
    alignItems: 'flex-start',
    marginLeft: 20,
  },
  statusMessageText: {
    lineHeight: 20,
    padding: 10,
    textAlign: 'center',
  },
  tagColorPickerColorItem: {
    height: 25,
    width: 25,
  },
  tagColorPickerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'lightgrey',
  },
  // Extra Specific Modal Styles
  titleText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.PRIMARY_HEADER_TEXT_SIZE,
    fontWeight: themes.TEXT_WEIGHT,
    paddingBottom: 10,
    textAlign: 'center',
  },
  titleTextError: {
    color: 'red',
  },
  titleTextWarning: {
    color: 'orange',
  },
  urlText: {
    fontSize: themes.SMALL_TEXT_SIZE,
  },
});

export default styles;
