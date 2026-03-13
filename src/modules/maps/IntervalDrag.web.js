import {useEffect, useRef} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {clearedIntervalDragState, setIntervalDragTargetSlot} from './maps.slice';
import {useSpots} from '../spots';
import useStratSectionCalculations from './strat-section/useStratSectionCalculations';

const SNAP_HIT_BUFFER = 12; // pixels

const IntervalDrag = ({mapRef}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const intervalDragState = useSelector(state => state.map.intervalDragState);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const selectedSpotRef = useRef(selectedSpot);
  selectedSpotRef.current = selectedSpot;
  const snapScreenYRef = useRef(0);
  snapScreenYRef.current = intervalDragState?.snapScreenY ?? 0;

  const {reorderInterval} = useStratSectionCalculations();
  const {getSpotById} = useSpots();

  /* Local State */

  const targetSlotIndexRef = useRef(0);
  const isDraggingSnapLineRef = useRef(false);
  const snapDragStartClientYRef = useRef(0);
  const snapDragStartScreenYRef = useRef(0);

  /* Derived Variables */

  const {slotMap} = intervalDragState || {};

  /* Internal Functions */

  function getSlotIndexForScreenY(screenY) {
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

  /* Side Effects */

  useEffect(() => {
    if (!intervalDragState) {
      isDraggingSnapLineRef.current = false;
      return;
    }

    targetSlotIndexRef.current = intervalDragState.targetSlotIndex ?? 0;

    const onMouseDown = (e) => {
      if (!mapRef?.current) return;
      const rect = mapRef.current.getContainer().getBoundingClientRect();
      const mapY = e.clientY - rect.top;
      if (Math.abs(mapY - snapScreenYRef.current) < SNAP_HIT_BUFFER) {
        isDraggingSnapLineRef.current = true;
        snapDragStartClientYRef.current = e.clientY;
        snapDragStartScreenYRef.current = snapScreenYRef.current;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onMouseMove = (e) => {
      if (!isDraggingSnapLineRef.current) return;
      const currentScreenY = snapDragStartScreenYRef.current + (e.clientY - snapDragStartClientYRef.current);
      const idx = getSlotIndexForScreenY(currentScreenY);
      if (idx !== targetSlotIndexRef.current) {
        targetSlotIndexRef.current = idx;
        dispatch(setIntervalDragTargetSlot(idx));
      }
    };

    const onMouseUp = () => {
      if (!isDraggingSnapLineRef.current) return;
      isDraggingSnapLineRef.current = false;
      const spot = selectedSpotRef.current;
      if (spot) {
        const slot = slotMap?.[targetSlotIndexRef.current];
        const preceding = slot?.precedingIntervalId ? getSpotById(slot.precedingIntervalId) : null;
        reorderInterval(spot, preceding);
      }
      dispatch(clearedIntervalDragState());
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [intervalDragState]);

  return null;
};

export default IntervalDrag;
