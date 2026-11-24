import React from 'react';

import {createStackNavigator} from '@react-navigation/stack';

import {NAVIGATION_OPTIONS} from './routes.constants';
import HomeContainer from '../modules/home/HomeContainer';
import ImageSlider from '../modules/images/ImageSlider';
import useAuthentication from '../modules/sign-in/useAuthentication.web';

const AppStack = () => {
  /* Data Hooks */

  useAuthentication();  // Here, not in Routes, so it checks the URL's login rather than one persisted from a last visit

  /* Derived Variables */

  const Stack = createStackNavigator();

  /* View */

  return (
    <Stack.Navigator>
      <Stack.Screen
        component={HomeContainer}
        name={'HomeScreen'}
        options={NAVIGATION_OPTIONS}
        // initialParams={{setIsSignedIn}}
      />
      <Stack.Screen
        component={ImageSlider}
        name={'ImageSlider'}
        options={NAVIGATION_OPTIONS}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
