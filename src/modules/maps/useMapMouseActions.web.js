import {useRef, useState} from 'react';

import * as turf from '@turf/turf';
import {useDispatch} from 'react-redux';

import {MAP_MODES} from './maps.constants';
import {setVertexEndCoords} from './maps.slice';
import useMap from './useMap';
import {isEmpty} from '../../shared/Helpers';

const useMapPressEvents = ({editFeatureVertex, mapRef, mapMode}) => {
  const [cursor, setCursor] = useState('');
  const [prevMapMode, setPrevMapMode] = useState(mapMode);

  const dispatch = useDispatch();

  const pointMoving = useRef(null);

  const {isDrawMode} = useMap();

  if (mapMode !== prevMapMode) {
    // console.log('MapMode changed from', prevMapMode, 'to', mapMode);
    setPrevMapMode(mapMode);
    if (isDrawMode(mapMode) || mapMode === MAP_MODES.EDIT) setCursor('pointer');
    else setCursor('');
  }

  //When the cursor enters a feature in the point edit layer, prepare for dragging.
  mapRef.current?.on('mouseenter', 'pointLayerEdit', () => {
    setCursor('move');
  });

  mapRef.current?.on('mouseleave', 'pointLayerEdit', () => {
    setCursor('default');
  });

  mapRef.current?.on('mousedown', 'pointLayerEdit', (e) => {
    pointMoving.current = editFeatureVertex;
    if (isEmpty(e.point)) return;
    setCursor('grab');
    mapRef.current?.on('mousemove', onPointMove);
    mapRef.current?.once('mouseup', onUp);
  });

  /* Internal Functions */

  const onPointMove = (e) => {
    setCursor('grabbing'); // Set a UI indicator for dragging

    // Update the Point feature and call setData to the update source edit layer
    const coords = e.lngLat;
    pointMoving.current = [{
      ...pointMoving.current[0],
      geometry: {...pointMoving.current[0].geometry, coordinates: [coords.lng, coords.lat]},
    }];
    mapRef.current?.getSource('editFeatureVertex').setData(turf.featureCollection(pointMoving.current));
  };

  const onUp = (e) => {
    setCursor('');

    // Unbind mouse/touch events
    mapRef.current?.off('mousemove', onPointMove);
    mapRef.current?.off('touchmove', onPointMove);

    const coords = e.lngLat;
    const vertexScreenCoords = mapRef.current.project([coords.lng, coords.lat]);
    dispatch(setVertexEndCoords([vertexScreenCoords.x, vertexScreenCoords.y]));
  };

  /* Exported Functions */

  const handleMouseEnter = () => {
    if (mapMode === MAP_MODES.VIEW || mapMode === MAP_MODES.EDIT) setCursor('pointer');
  };

  const handleMouseLeave = () => {
    if (mapMode === MAP_MODES.VIEW) setCursor('');
    else if (isDrawMode(mapMode)) setCursor('pointer');
    else if (mapMode === MAP_MODES.EDIT) setCursor('default');
  };

  return {
    cursor,
    handleMouseEnter,
    handleMouseLeave,
  };

};

export default useMapPressEvents;
