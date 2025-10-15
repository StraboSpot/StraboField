import {Platform, StyleSheet} from 'react-native';

import * as themes from '../../styles.constants';
import {LIGHTGREY, SMALL_SCREEN} from '../../styles.constants';

const styles = StyleSheet.create({
  animationContainer: {
    height: 150,
    marginBottom: 20,
  },
  backdropStyles: {
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginRight: 10,
    paddingTop: 10,
  },
  buttonStyle: {
    backgroundColor: themes.PRIMARY_ACCENT_COLOR,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  buttonText: {
    // color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.PRIMARY_TEXT_SIZE,
  },
  clearButtonText: {
    color: themes.PRIMARY_ACCENT_COLOR,
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
  headerText: {
    color: 'red',
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  importantText: {
    color: 'red',
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: themes.TEXT_WEIGHT_500,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: themes.PRIMARY_BACKGROUND_COLOR,
    borderWidth: 1,
  },
  overlayContainer: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderColor: themes.MEDIUMGREY,
    borderRadius: themes.MODAL_BORDER_RADIUS,
    borderWidth: 0.5,
    elevation: 2,
    maxHeight: '80%',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 300,
  },
  overlayContainerFullScreen: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    overflow: 'hidden',
    paddingTop: Platform.OS === 'ios' && SMALL_SCREEN ? 50 : 0,
    zIndex: 1,
  },
  overlayContent: {
    alignItems: 'center',
    marginTop: 5,
    // backgroundColor: 'green',
  },
  overlayMapMenuPosition: {
    bottom: 100,
    flex: 1,
    left: 75,
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
    borderColor: 'white',
    borderWidth: 1,
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
    borderColor: LIGHTGREY,
  },
  // Extra Specific Modal Styles
  titleText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.MEDIUM_TEXT_SIZE,
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
