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
  // Large screens keep the geolocate button in the bottom left corner, so the bar starts clear of it
  scaleZoomContainer: {
    bottom: 30,
    left: 70,
    position: 'absolute',
    zIndex: 1,
  },
  // Small screens lay this out in the map action button column rather than over the map, so it is not
  // positioned at all - the column places it. See SMALL_SCREEN_MAP_STACK
  scaleZoomContainerSmall: {
    alignItems: 'flex-start',
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
