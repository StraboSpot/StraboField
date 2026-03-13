import React from 'react';
import {StyleSheet, View} from 'react-native';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {runOnJS, useAnimatedStyle, useSharedValue} from 'react-native-reanimated';
import {useDispatch, useSelector} from 'react-redux';

import {clearedIntervalDragState} from './maps.slice';
import {useSpots} from '../spots';
import useStratSectionCalculations from './strat-section/useStratSectionCalculations';

const IntervalDrag = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const intervalDragState = useSelector(state => state.map.intervalDragState);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {reorderInterval} = useStratSectionCalculations();
  const {getSpotById} = useSpots();

  /* Local State */

  const snapOffsetY = useSharedValue(0);
  const targetSlotIndexShared = useSharedValue(intervalDragState?.targetSlotIndex ?? 0);

  /* Derived Variables */

  const {startScreenY, slotMap} = intervalDragState || {};

  /* Internal Functions */

  function executeReorder(slotIndex) {
    if (!selectedSpot) {
      dispatch(clearedIntervalDragState());
      return;
    }
    const slot = slotMap?.[slotIndex];
    const precedingInterval = slot?.precedingIntervalId ? getSpotById(slot.precedingIntervalId) : null;
    reorderInterval(selectedSpot, precedingInterval);
    dispatch(clearedIntervalDragState());
  }

  /* Gesture */

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      const currentScreenY = startScreenY + e.translationY;
      let best = 0;
      let bestDist = Math.abs(currentScreenY - slotMap[0].screenY);
      for (let i = 1; i < slotMap.length; i++) {
        const d = Math.abs(currentScreenY - slotMap[i].screenY);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      targetSlotIndexShared.value = best;
      snapOffsetY.value = (slotMap[best]?.screenY ?? currentScreenY) - startScreenY;
    })
    .onEnd(() => {
      runOnJS(executeReorder)(targetSlotIndexShared.value);
    });

  /* Render Functions */

  const SNAP_HIT_BUFFER = 12;

  const snapLineAnimStyle = useAnimatedStyle(() => ({
    transform: [{translateY: snapOffsetY.value}],
  }));

  const snapLineHitAreaStyle = useAnimatedStyle(() => ({
    top: startScreenY + snapOffsetY.value - SNAP_HIT_BUFFER,
    height: 3 + SNAP_HIT_BUFFER * 2,
  }));

  if (!intervalDragState) return null;

  return (
    <View
      pointerEvents='box-none'
      style={[StyleSheet.absoluteFill, {zIndex: 100}]}
    >
      <Animated.View
        pointerEvents='none'
        style={[styles.snapLine, {top: startScreenY}, snapLineAnimStyle]}
      />
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.snapLineHitArea, snapLineHitAreaStyle]}/>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  snapLine: {
    backgroundColor: 'orange',
    height: 3,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  snapLineHitArea: {
    left: 0,
    position: 'absolute',
    right: 0,
  },
});

export default IntervalDrag;
