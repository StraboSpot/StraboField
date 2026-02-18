import React from 'react';
import {Linking, Pressable, Text} from 'react-native';

import SplashScreen from './SplashScreen';
import {WHITE} from '../../shared/styles.constants';

const AuthenticationErrorSplashScreen = () => {
  /* Derived Variables */

  console.count('Rendering AuthenticationErrorSplashScreen ...');

  /* View */

  return (
    <SplashScreen>
      <Text style={{paddingTop: 50, color: WHITE, fontSize: 30, textAlign: 'center'}}>
        Authentication Error!{'\n'}
        Please log in to StraboSpot again.
      </Text>
      <Pressable onPress={() => Linking.openURL('https://strabospot.org/login')}>
        <Text style={{paddingBottom: 50, color: WHITE, fontSize: 24, textAlign: 'center'}}>
          https://strabospot.org/login
        </Text>
      </Pressable>
    </SplashScreen>
  );
};

export default AuthenticationErrorSplashScreen;
