import {Platform, StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';

const styles = StyleSheet.create({
  // Where the card may be, down to just above the bottom of the screen
  area: {
    bottom: 10,
    position: 'absolute',
    right: 65,
    top: 85,
    width: 350,
  },
  // Inset from the screen edges, clear of the status bar the map runs under on iOS
  areaSmallScreen: {
    bottom: 10,
    left: 10,
    position: 'absolute',
    right: 10,
    top: Platform.OS === 'ios' ? 40 : 10,
    zIndex: 1,
  },
  container: {
    borderRadius: themes.MODAL_BORDER_RADIUS,
    borderWidth: 0.5,
    margin: 0,
    maxHeight: '100%',
    padding: 10,
  },
  coordsText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginBottom: 8,
  },
  descriptionContent: {
    marginBottom: 10,
  },
  field: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontWeight: 'bold',
  },
  urlText: {
    color: themes.PRIMARY_ACCENT_COLOR,
  },
  // Card's own wrapper around its content, which has to shrink for the content to scroll
  wrapper: {
    flexShrink: 1,
  },
});

export default styles;
