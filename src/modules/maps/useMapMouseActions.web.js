import {useEffect, useRef, useState} from 'react';

import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../shared/helpers';
import {useSpots} from '../spots';
import {MAP_MODES} from './maps.constants';
import {clearedIntervalDragState, setIntervalDragTargetSlot, setVertexEndCoords} from './maps.slice';
import useStratSectionCalculations from './strat-section/useStratSectionCalculations';
import useMap from './useMap';

const SNAP_HIT_BUFFER = 12; // pixels

const useMapMouseActions = ({editFeatureVertex, mapRef, mapMode}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const intervalDragState = useSelector(state => state.map.intervalDragState);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {isDrawMode} = useMap();
  const {reorderInterval} = useStratSectionCalculations();
  const {getSpotById} = useSpots();

  /* Local State */

  const pointMoving = useRef(null);

  const [cursor, setCursor] = useState('');
  const [prevMapMode, setPrevMapMode] = useState(mapMode);

  /* Interval Drag Refs */

  const selectedSpotRef = useRef(selectedSpot);
  selectedSpotRef.current = selectedSpot;
  const snapScreenYRef = useRef(0);
  snapScreenYRef.current = intervalDragState?.snapScreenY ?? 0;
  const slotMapRef = useRef(null);
  slotMapRef.current = intervalDragState?.slotMap ?? null;
  const isDraggingSnapLineRef = useRef(false);
  const snapDragStartClientYRef = useRef(0);
  const snapDragStartScreenYRef = useRef(0);
  const targetSlotIndexRef = useRef(0);
  const getSpotByIdRef = useRef(getSpotById);
  getSpotByIdRef.current = getSpotById;
  const reorderIntervalRef = useRef(reorderInterval);
  reorderIntervalRef.current = reorderInterval;

  /* Derived Variables */

  if (mapMode !== prevMapMode) {
    // console.log('MapMode changed from', prevMapMode, 'to', mapMode);
    setPrevMapMode(mapMode);
    if (isDrawMode(mapMode) || mapMode === MAP_MODES.EDIT) setCursor('pointer');
    else setCursor('');
  }

  /* Side Effects */

  useEffect(() => {
    if (!intervalDragState) {
      isDraggingSnapLineRef.current = false;
    }
    else {
      targetSlotIndexRef.current = intervalDragState.targetSlotIndex ?? 0;
    }
  }, [intervalDragState]);

  useEffect(() => {
    function getSlotIndexForScreenY(screenY) {
      const slotMap = slotMapRef.current;
      if (!slotMap?.length) return 0;
      let best = 0;
      let bestDist = Math.abs(screenY - slotMap[0].screenY);
      for (let i = 1; i < slotMap.length; i++) {
        const d = Math.abs(screenY - slotMap[i].screenY);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      return best;
    }

    const onWindowMouseMove = (e) => {
      if (!isDraggingSnapLineRef.current) return;
      const currentScreenY = snapDragStartScreenYRef.current + (e.clientY - snapDragStartClientYRef.current);
      const idx = getSlotIndexForScreenY(currentScreenY);
      if (idx !== targetSlotIndexRef.current) {
        targetSlotIndexRef.current = idx;
        dispatch(setIntervalDragTargetSlot(idx));
      }
    };

    const onWindowMouseUp = (e) => {
      if (!isDraggingSnapLineRef.current) return;
      isDraggingSnapLineRef.current = false;
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
      // Require actual movement — if the mouse barely moved treat it as a click,
      // don't reorder. Leave intervalDragState set so handleMapPress can handle it.
      if (Math.abs(e.clientY - snapDragStartClientYRef.current) < 5) return;
      const spot = selectedSpotRef.current;
      if (spot) {
        const slot = slotMapRef.current?.[targetSlotIndexRef.current];
        const preceding = slot?.precedingIntervalId ? getSpotByIdRef.current(slot.precedingIntervalId) : null;
        reorderIntervalRef.current(spot, preceding);
      }
      dispatch(clearedIntervalDragState());
    };

    const onSnapLineMouseDown = (e) => {
      if (!slotMapRef.current) return; // not in drag mode
      if (!mapRef?.current) return;
      const rect = mapRef.current.getContainer().getBoundingClientRect();
      const mapY = e.clientY - rect.top;
      if (Math.abs(mapY - snapScreenYRef.current) < SNAP_HIT_BUFFER) {
        isDraggingSnapLineRef.current = true;
        snapDragStartClientYRef.current = e.clientY;
        snapDragStartScreenYRef.current = snapScreenYRef.current;
        e.preventDefault();
        window.addEventListener('mousemove', onWindowMouseMove);
        window.addEventListener('mouseup', onWindowMouseUp);
      }
    };

    window.addEventListener('mousedown', onSnapLineMouseDown);
    return () => {
      window.removeEventListener('mousedown', onSnapLineMouseDown);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMouseEnter = () => setCursor('move');
    const onMouseLeave = () => setCursor('default');
    const onPointLayerMouseDown = (e) => {
      pointMoving.current = editFeatureVertexRef.current;
      if (isEmpty(e.point)) return;
      setCursor('grab');
      map.on('mousemove', onPointMove);
      map.once('mouseup', onUp);
    };

    map.on('mouseenter', 'pointLayerEdit', onMouseEnter);
    map.on('mouseleave', 'pointLayerEdit', onMouseLeave);
    map.on('mousedown', 'pointLayerEdit', onPointLayerMouseDown);
    return () => {
      map.off('mouseenter', 'pointLayerEdit', onMouseEnter);
      map.off('mouseleave', 'pointLayerEdit', onMouseLeave);
      map.off('mousedown', 'pointLayerEdit', onPointLayerMouseDown);
    };
  }, [mapRef.current]);

  /* Internal Functions */

  const editFeatureVertexRef = useRef(editFeatureVertex);
  editFeatureVertexRef.current = editFeatureVertex;

  const onPointMove = useRef((e) => {
    setCursor('grabbing');
    const coords = e.lngLat;
    pointMoving.current = [{
      ...pointMoving.current[0],
      geometry: {...pointMoving.current[0].geometry, coordinates: [coords.lng, coords.lat]},
    }];
    mapRef.current?.getSource('editFeatureVertex').setData(turf.featureCollection(pointMoving.current));
  }).current;

  const onUp = useRef((e) => {
    setCursor('');
    mapRef.current?.off('mousemove', onPointMove);
    mapRef.current?.off('touchmove', onPointMove);
    const coords = e.lngLat;
    const vertexScreenCoords = mapRef.current.project([coords.lng, coords.lat]);
    dispatch(setVertexEndCoords([vertexScreenCoords.x, vertexScreenCoords.y]));
  }).current;


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

export default useMapMouseActions;
