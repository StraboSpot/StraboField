import React from 'react';
import {Text} from 'react-native';

import SplashScreen from './SplashScreen';
import splashScreenStyles from './splashScreen.styles';
import BallIndicator from '../../shared/ui/BallIndicator';

const LoadingSplashScreen = () => {
  /* Derived Variables */

  console.count('Rendering LoadingSplashScreen...');

  /* View */

  return (
    <SplashScreen>
      <Text style={splashScreenStyles.loadingSplashScreenText}>Getting Project...</Text>
      <BallIndicator
        color={'darkgrey'}
        size={60}
      />
    </SplashScreen>
  );
};

export default LoadingSplashScreen;
