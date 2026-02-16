import {useDispatch, useSelector} from 'react-redux';

import {ZOOM_STRAT_SECTION} from './maps.constants';
import {setIsMapMoved} from './maps.slice';
import useMapView from './useMapView';

const useMapMoveEvents = ({setViewState}) => {
  /* Data Hooks / State */

  const dispatch = useDispatch();

  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const isMapMoved = useSelector(state => state.map.isMapMoved);
  const stratSection = useSelector(state => state.map.stratSection);

  const {setMapView} = useMapView();

  /* Exported Functions */

  // Update spots in extent and saved view (center and zoom)
  const handleMapMoved = async (e) => {
    // console.log('Event onMapMoved', e);
    if (!isMapMoved) dispatch(setIsMapMoved(true));
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
