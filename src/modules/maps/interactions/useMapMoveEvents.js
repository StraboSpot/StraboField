import {useRef} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {setZoom} from '../maps.slice';
import useMapView from '../view/useMapView';

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

  /* Internal Functions */

  const saveMapView = async () => {
    if (currentImageBasemap || stratSection || !mapRef?.current) return;
    const newCenter = await mapRef.current.getCenter();
    const newZoom = await mapRef.current.getZoom();
    dispatch(setZoom(newZoom));
    setMapView(newCenter, newZoom);
  };

  /* Exported Functions */

  // Update spots in extent and saved view (center and zoom)
  const handleMapMoved = async (e) => {
    // Trailing debounce: recompute the extent, and take the camera's final reading, once the map settles.
    // Saving here as well as below is what keeps the zoom honest - the throttle can otherwise let a
    // gesture finish without recording where it ended
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    settleTimeoutRef.current = setTimeout(() => {
      saveMapView().catch(console.error);
      onMapMoveEnd?.();
    }, MAP_SETTLE_DEBOUNCE_MS);

    // Throttled while the gesture is still running, so the readouts keep up without a dispatch per frame
    if (e.timestamp - cameraChangedTimestampRef.current > 1000) {
      cameraChangedTimestampRef.current = e.timestamp;
      await saveMapView();
    }
  };

  return {
    handleMapMoved,
  };

};

export default useMapMoveEvents;
