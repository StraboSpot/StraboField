import React from 'react';

import {createStackNavigator} from '@react-navigation/stack';

import HomeContainer from '../modules/home/HomeContainer';
import {ImageSlider} from '../modules/images';

const AppStack = () => {

  const Stack = createStackNavigator();

  const navigationOptions = {
    gestureEnabled: false,
    headerShown: false,
  };


  return (
    <Stack.Navigator>
      <Stack.Screen
        name={'HomeScreen'}
        component={HomeContainer}
        options={navigationOptions}
        // initialParams={{setIsSignedIn}}
      />
      <Stack.Screen
        name={'ImageSlider'}
        component={ImageSlider}
        options={navigationOptions}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
