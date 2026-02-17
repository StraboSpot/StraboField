import React from 'react';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';

import {useWindowSize} from '../../shared/ui/useWindowSize';

const ImageZoomAndPanWrapper = ({children}) => {
  /* Data Hooks */

  const {width, height} = useWindowSize();

  /* Local State */

  // Zoom and Pan state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Animated style for the image
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
        {scale: scale.value},
      ],
    };
  });

  /* Derived Variables */

  // Double tap to reset zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      savedScale.value = 1;
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    });

  // Pan gesture for moving the image with boundary constraints
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newTranslateX = savedTranslateX.value + e.translationX;
      const newTranslateY = savedTranslateY.value + e.translationY;

      // Calculate boundaries based on scale
      const currentScale = scale.value;
      const scaledWidth = width * currentScale;
      const scaledHeight = height * currentScale;

      // Max pan distance (half of scaled size minus half of container size)
      const maxTranslateX = Math.max(0, (scaledWidth - width) / 2);
      const maxTranslateY = Math.max(0, (scaledHeight - height) / 2);

      // Constrain translation within boundaries
      translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
      translateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY));
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Pinch gesture for zooming with boundary constraints
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      // Constrain scale between 1x and 5x
      scale.value = Math.max(1, Math.min(5, newScale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      // Adjust pan position to stay within bounds after zoom
      const currentScale = scale.value;
      const scaledWidth = width * currentScale;
      const scaledHeight = height * currentScale;
      const maxTranslateX = Math.max(0, (scaledWidth - width) / 2);
      const maxTranslateY = Math.max(0, (scaledHeight - height) / 2);

      // Clamp current position to new boundaries
      translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX.value));
      translateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY.value));
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture),
  );

  /* View */

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View collapsable={false} style={[animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

export default ImageZoomAndPanWrapper;
