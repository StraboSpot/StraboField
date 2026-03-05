import React from 'react';
import {Text} from 'react-native';

import {BallIndicator} from 'react-native-indicators';

import SplashScreen from './SplashScreen';
import splashScreenStyles from './splashScreen.styles';

const LoadingSplashScreen = () => {
  /* Derived Variables */

  console.count('Rendering LoadingSplashScreen...');

  /* View */

  return (
    <SplashScreen>
      <Text style={splashScreenStyles.loadingSplashScreenText}>Getting Project...</Text>
      <BallIndicator
        color={'darkgrey'}
        count={8}
        size={60}
      />
    </SplashScreen>
  );
};

export default LoadingSplashScreen;
