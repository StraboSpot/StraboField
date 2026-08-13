import React from 'react';
import {ActivityIndicator, View} from 'react-native';

import {Icon} from '@rn-vui/base';

// Stands in for the Lottie animations on web, driven by the same `type` the native component takes. Every type
// other than the two terminal ones represents work in progress, so it spins.
const LottieAnimation = ({animationStyle, type}) => {
  /* Derived Variables */

  const isComplete = type === 'complete';
  const isError = type === 'error';

  /* View */

  return (
    <View style={[{justifyContent: 'center', alignItems: 'center', marginTop: 30}, animationStyle]}>
      {isComplete || isError ? (
        <Icon
          color={isError ? '#930808' : '#517fa4'}
          name={isError ? 'alert-circle-outline' : 'check-circle-outline'}
          reverse
          size={35}
          type={'material-community'}
        />
      ) : <ActivityIndicator size={75}/>}
    </View>
  );
};

export default LottieAnimation;
