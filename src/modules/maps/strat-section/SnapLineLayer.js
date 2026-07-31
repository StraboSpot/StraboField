import React from 'react';
import {StyleSheet, View} from 'react-native';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {runOnJS, useAnimatedStyle, useSharedValue} from 'react-native-reanimated';
import {useDispatch, useSelector} from 'react-redux';

import useStratSectionCalculations from './useStratSectionCalculations';
import {LARGE_TEXT_SIZE, ORANGE} from '../../../shared/styles.constants';
import {useSpots} from '../../spots';
import {clearedIntervalDragState} from '../maps.slice';

const SnapLineLayer = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const intervalDragState = useSelector(state => state.map.intervalDragState);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {getSpotById} = useSpots();
  const {reorderInterval} = useStratSectionCalculations();

  /* Local State */

  const snapOffsetY = useSharedValue(0);

  const snapLineAnimStyle = useAnimatedStyle(() => ({transform: [{translateY: snapOffsetY.value}]}));

  const SNAP_HIT_BUFFER = 12;
  const {startScreenY, slotMap} = intervalDragState || {};

  const snapLineHitAreaStyle = useAnimatedStyle(() => ({
    top: startScreenY + snapOffsetY.value - SNAP_HIT_BUFFER,
    height: 3 + SNAP_HIT_BUFFER * 2,
  }));
  const targetSlotIndexShared = useSharedValue(intervalDragState?.targetSlotIndex ?? 0);

  /* Logic Helpers */

  const executeReorder = (slotIndex) => {
    if (!selectedSpot) {
      dispatch(clearedIntervalDragState());
      return;
    }
    const slot = slotMap?.[slotIndex];
    const precedingInterval = slot?.precedingIntervalId ? getSpotById(slot.precedingIntervalId) : null;
    reorderInterval(selectedSpot, precedingInterval);
    dispatch(clearedIntervalDragState());
  };

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

  /* View */

  return (
    <View
      pointerEvents={'box-none'}
      style={[StyleSheet.absoluteFill, {zIndex: 100}]}
    >
      <Animated.View
        pointerEvents={'none'}
        style={[styles.snapLine, {top: startScreenY}, snapLineAnimStyle]}
      />
      <Animated.Text
        pointerEvents={'none'}
        style={[styles.arrowUp, {top: startScreenY - LARGE_TEXT_SIZE + 2}, snapLineAnimStyle]}
      >
        ▲
      </Animated.Text>
      <Animated.Text
        pointerEvents={'none'}
        style={[styles.arrowDown, {top: startScreenY}, snapLineAnimStyle]}
      >
        ▼
      </Animated.Text>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.snapLineHitArea, snapLineHitAreaStyle]}/>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  arrowDown: {
    color: ORANGE,
    fontSize: LARGE_TEXT_SIZE,
    left: 0,
    lineHeight: LARGE_TEXT_SIZE,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
  },
  arrowUp: {
    color: ORANGE,
    fontSize: LARGE_TEXT_SIZE,
    left: 0,
    lineHeight: LARGE_TEXT_SIZE,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
  },
  snapLine: {
    backgroundColor: ORANGE,
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

export default SnapLineLayer;
