import {useRef} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {setZoom} from './maps.slice';
import useMapView from './useMapView';

// Recompute the Spots in the map extent this long after the map stops moving, so a continuous
// pan/zoom gesture triggers a single recompute once the camera settles instead of one per frame.
const MAP_SETTLE_DEBOUNCE_MS = 400;

const useMapMoveEvents = ({mapRef, onMapMoveEnd}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const stratSection = useSelector(state => state.map.stratSection);

  const {setMapView} = useMapView();

  /* Local State */

  const cameraChangedTimestampRef = useRef(0);
  const settleTimeoutRef = useRef(null);

  /* Exported Functions */

  // Update spots in extent and saved view (center and zoom)
  const handleMapMoved = async (e) => {
    // Trailing debounce: recompute the extent only once the map has settled.
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    settleTimeoutRef.current = setTimeout(() => onMapMoveEnd?.(), MAP_SETTLE_DEBOUNCE_MS);

    // console.log('Event onMapMoved Timestamp difference', e.timestamp - cameraChangedTimestampRef.current);
    if (e.timestamp - cameraChangedTimestampRef.current > 1000) {
      // console.log('Map Moved.');
      cameraChangedTimestampRef.current = e.timestamp;
      if (!currentImageBasemap && !stratSection && mapRef?.current) {
        // console.log('Updating View...');
        const newCenter = await mapRef.current.getCenter();
        const newZoom = await mapRef.current.getZoom();
        dispatch(setZoom(newZoom));
        setMapView(newCenter, newZoom);
      }
    }
  };

  return {
    handleMapMoved,
  };

};

export default useMapMoveEvents;
