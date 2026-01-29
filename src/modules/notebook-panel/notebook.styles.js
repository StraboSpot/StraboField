import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';
import {MEDIUMGREY, SMALL_SCREEN} from '../../shared/styles.constants';

const notebookStyles = StyleSheet.create({
  centerContainer: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    flex: 1,
  },
  dialogBoxPosition: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  dialogContainer: {
    height: 'auto',
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderColor: themes.MEDIUMGREY,
    borderRadius: themes.MODAL_BORDER_RADIUS,
    borderWidth: 0.5,
    elevation: 2,
    position: SMALL_SCREEN ? 'null' : 'absolute',
    right: SMALL_SCREEN ? 0 : 30,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    top: SMALL_SCREEN ? 0 : 20,
    width: 200,
  },
  dialogTitle: {
    backgroundColor: themes.PRIMARY_ACCENT_COLOR,
  },
  footerContainer: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderTopColor: themes.MEDIUMGREY,
    borderTopWidth: 0.5,
  },
  headerContainer: {
    alignItems: 'center',
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderBottomColor: themes.MEDIUMGREY,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    paddingLeft: 10,
  },
  notebookDrawer: {
    height: '100%',
    position: 'absolute',
    right: 0,
    width: 400,
    zIndex: -1,
  },
  notebookPanel: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderLeftColor: MEDIUMGREY,
    borderLeftWidth: 2,
    flex: 1,
  },
  traceSurfaceFeatureContainer: {
    borderBottomColor: themes.MEDIUMGREY,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  traceSurfaceFeatureToggleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingLeft: 10,
  },
  traceSurfaceFeatureToggleText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    paddingRight: 10,
  },
});

export default notebookStyles;
