import React from 'react';

import LottieView from 'lottie-react-native';

import useAnimations from '../../shared/ui/useAnimations';

const LottieAnimation = ({animationStyle, type, doesLoop}) => {
  // console.log('LOOPS IN RN', doesLoop);

  const {getAnimationType} = useAnimations();

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
