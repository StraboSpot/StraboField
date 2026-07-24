import {useRef} from 'react';

import {useSelector} from 'react-redux';

import {ZOOM_STRAT_SECTION} from '../maps.constants';
import useMapView from '../view/useMapView';

// Recompute the Spots in the map extent this long after the map stops moving, so successive
// move-end events coalesce into a single recompute once the camera settles.
const MAP_SETTLE_DEBOUNCE_MS = 400;

const useMapMoveEvents = ({setViewState, onMapMoveEnd}) => {
  /* Data Hooks */

  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const stratSection = useSelector(state => state.map.stratSection);

  const {setMapView} = useMapView();

  /* Local State */

  const settleTimeoutRef = useRef(null);

  /* Exported Functions */

  // Update spots in extent and saved view (center and zoom)
  const handleMapMoved = async (e) => {
    // Trailing debounce: recompute the extent only once the map has settled.
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    settleTimeoutRef.current = setTimeout(() => onMapMoveEnd?.(), MAP_SETTLE_DEBOUNCE_MS);

    // console.log('Event onMapMoved', e);
    if (currentImageBasemap || stratSection) {
      // TODO Next line is a hack to fix image basemaps and strat section zooming issue on fresh load
      const newZoom = e.viewState.zoom < 1 ? ZOOM_STRAT_SECTION : e.viewState.zoom;
      setViewState({...e.viewState, zoom: newZoom});
    }
    else {
      console.log('evt.viewState', e.viewState);
      setViewState(e.viewState);
      const newCenter = [e.viewState.longitude, e.viewState.latitude];
      const newZoom = e.viewState.zoom;
      setMapView(newCenter, newZoom);
    }
  };

  return {
    handleMapMoved,
  };

};

export default useMapMoveEvents;
