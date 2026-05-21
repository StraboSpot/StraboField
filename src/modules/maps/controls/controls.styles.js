import {StyleSheet} from 'react-native';

import {BLACK, SMALL_TEXT_SIZE} from '../../../shared/styles.constants';

export default StyleSheet.create({
  scaleBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomWidth: 2,
    borderColor: BLACK,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    height: 20,
    justifyContent: 'center',
  },
  scaleBarLabel: {
    color: BLACK,
    fontSize: SMALL_TEXT_SIZE,
    fontWeight: 'bold',
    paddingLeft: 4,
  },
  scaleZoomContainer: {
    bottom: 30,
    left: 70,
    position: 'absolute',
    zIndex: 1,
  },
  scaleZoomContainerSmall: {
    bottom: 75,
    left: 75,
    position: 'absolute',
    zIndex: 1,
  },
  zoomContainer: {
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  zoomLabel: {
    color: BLACK,
    fontSize: SMALL_TEXT_SIZE,
    fontWeight: 'bold',
  },
});
