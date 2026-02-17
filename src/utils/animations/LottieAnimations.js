import React from 'react';

import LottieView from 'lottie-react-native';

import {getAnimationType} from './animations.helpers';

const LottieAnimation = ({animationStyle, type, doesLoop}) => {

  /* View */

  return (
    <LottieView
      autoPlay
      loop={doesLoop}
      source={getAnimationType(type)}
      style={[{width: 100, height: 100, alignSelf: 'center'}, animationStyle]}
    />
  );
};

export default LottieAnimation;
