import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';

import {Icon} from '@rn-vui/base';

// Kept in step with the animation size in LottieAnimations.js so both platforms default to the same footprint.
const DEFAULT_SIZE = 100;

// Stands in for the Lottie animations on web, driven by the same `type` the native component takes. Every type
// other than the two terminal ones represents work in progress, so it spins.
const LottieAnimation = ({animationStyle, type}) => {
  /* Derived Variables */

  const isError = type === 'error';
  const isTerminal = isError || type === 'complete';
  // Native sizes the animation itself, while this wraps a fixed-size child that would overflow a smaller wrapper,
  // so scale the child to whatever footprint the caller asked for.
  const {height, width} = StyleSheet.flatten(animationStyle) || {};
  const contentSize = Math.min(height || DEFAULT_SIZE, width || DEFAULT_SIZE);

  /* View */

  return (
    <View style={[{alignItems: 'center', justifyContent: 'center'}, animationStyle]}>
      {isTerminal ? (
        <Icon
          color={isError ? '#930808' : '#517fa4'}
          name={isError ? 'alert-circle-outline' : 'check-circle-outline'}
          reverse
          size={contentSize * 0.35}
          type={'material-community'}
        />
      ) : <ActivityIndicator size={contentSize * 0.75}/>}
    </View>
  );
};

export default LottieAnimation;
