import {Platform} from 'react-native';

import {useSelector} from 'react-redux';

import {getSnappedCoord} from './editing.helpers';
import useMapFeaturesCalculated from '../features/useMapFeaturesCalculated';
import useMapCoords from '../view/useMapCoords';

// Snaps a vertex being placed or moved onto a nearby Spot, when Snap to Spots is on (Adding New Spots)
const useMapSnap = (mapRef) => {
  /* Data Hooks */

  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const snapping = useSelector(state => state.map.snapping);
  const stratSection = useSelector(state => state.map.stratSection);

  const {convertImagePixelsToLatLong} = useMapCoords();
  const {getSpotsNearPress} = useMapFeaturesCalculated(mapRef);

  /* Exported Functions */

  // Snap coord, the [lng, lat] at screenPoint, onto a Spot drawn on the map. Only drawn Spots are found, so hidden
  // ones are never targets. spotEditing is skipped, or a moved vertex would snap back to where it started;
  // editedSpots replace their stored versions, which the unsaved edit has moved.
  const snapCoord = async ([x, y], coord, spotEditing = {}, editedSpots = []) => {
    if (!snapping.isOn) return coord;
    const {pixelTolerance} = snapping;
    const toleranceCoord = Platform.OS === 'web' ? mapRef.current.unproject([x + pixelTolerance, y]).toArray()
      : await mapRef.current.getCoordinateFromView([x + pixelTolerance, y]);
    // Snapping to a Spot doesn't change it, so a read-only one is a fine target
    const spotsNearPress = await getSpotsNearPress(x, y, pixelTolerance, true);
    const snapTargets = spotsNearPress
      .filter(spot => spot.properties.id !== spotEditing.properties?.id)
      .map(spot => editedSpots.find(editedSpot => editedSpot.properties.id === spot.properties.id) || spot)
      .map(spot => (currentImageBasemap || stratSection ? convertImagePixelsToLatLong(JSON.parse(JSON.stringify(spot)))
        : spot));
    return getSnappedCoord(coord, toleranceCoord, snapTargets);
  };

  return {
    snapCoord,
  };
};

export default useMapSnap;
