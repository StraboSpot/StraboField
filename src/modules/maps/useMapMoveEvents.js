import {useRef} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {setIsMapMoved, setZoom} from './maps.slice';
import useMapView from './useMapView';

const useMapMoveEvents = ({mapRef}) => {
  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const isMapMoved = useSelector(state => state.map.isMapMoved);
  const stratSection = useSelector(state => state.map.stratSection);

  const cameraChangedTimestampRef = useRef(0);

  const {setMapView} = useMapView();

  // Update spots in extent and saved view (center and zoom)
  const handleMapMoved = async (e) => {
    // console.log('Event onMapMoved Timestamp difference', e.timestamp - cameraChangedTimestampRef.current);
    if (e.timestamp - cameraChangedTimestampRef.current > 1000) {
      // console.log('Map Moved.');
      cameraChangedTimestampRef.current = e.timestamp;
      if (!isMapMoved) dispatch(setIsMapMoved(true));
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
