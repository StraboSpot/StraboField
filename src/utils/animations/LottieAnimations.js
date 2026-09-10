import React from 'react';

import LottieView from 'lottie-react-native';

import {getAnimationType} from './animations.helpers';

const LottieAnimation = ({animationStyle, doesLoop, type}) => {
  /* View */

  return (
    <LottieView
      autoPlay
      loop={doesLoop}
      source={getAnimationType(type)}
      style={[{alignSelf: 'center', height: 100, width: 100}, animationStyle]}
    />
  );
};

export default LottieAnimation;
