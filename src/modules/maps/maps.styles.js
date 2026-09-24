import {StyleSheet} from 'react-native';

import {LIGHTGREY, MEDIUMGREY, PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';

const circleRadius = 20;
const thumbnailSize = 40;
// The size a 256px tile is drawn at. Below its own size, so the box shows more of it than a 1:1 crop would -
// a quarter of the tile rather than a sixth - without shrinking a drawn map far enough to turn its labels to noise.
const thumbnailTileDrawnSize = 160;

const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: -1,
  },
  map: {
    flex: 1,
  },
  // --- Map list thumbnail ---
  // The border carries which map is showing, so the row itself needs no marker
  thumbnail: {
    alignItems: 'center',
    backgroundColor: LIGHTGREY,
    borderColor: MEDIUMGREY,
    borderRadius: 6,
    borderWidth: 1,
    height: thumbnailSize,
    justifyContent: 'center',
    overflow: 'hidden',
    width: thumbnailSize,
  },
  thumbnailSelected: {
    borderColor: PRIMARY_ACCENT_COLOR,
    borderWidth: 3,
  },
  // Clipped by the box above, so the thumbnail is a close-up of the middle of the tile. Squeezed into 40px
  // whole instead, a labeled street map reads as noise rather than as a map. Offset by hand rather than left to
  // flexbox, which centers a child bigger than its container on some platforms and pins it to the top left on
  // others.
  thumbnailTile: {
    height: thumbnailTileDrawnSize,
    left: (thumbnailSize - thumbnailTileDrawnSize) / 2,
    position: 'absolute',
    top: (thumbnailSize - thumbnailTileDrawnSize) / 2,
    width: thumbnailTileDrawnSize,
  },
  // --- MapPoint Style ---
  vertexEditPoint: {
    borderColor: 'white',
    borderRadius: circleRadius,
    borderWidth: 2,
    height: circleRadius,
    position: 'absolute',
    width: circleRadius,
  },
});

export default mapStyles;
