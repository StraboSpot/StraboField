import React from 'react';

import {createStackNavigator} from '@react-navigation/stack';

import {NAVIGATION_OPTIONS} from './routes.constants';
import DocumentationScreen from '../modules/help/documentation/DocumentationScreen';
import HomeContainer from '../modules/home/HomeContainer';
import {ImageSlider} from '../modules/images';

const AppStack = () => {
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
      <Stack.Screen
        component={DocumentationScreen}
        name={'DocumentationScreen'}
        options={NAVIGATION_OPTIONS}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
