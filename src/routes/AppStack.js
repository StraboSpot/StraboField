import React from 'react';

import {createStackNavigator} from '@react-navigation/stack';

import DocumentationScreen from '../modules/help/DocumentationScreen';
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
        component={HomeContainer}
        name={'HomeScreen'}
        options={navigationOptions}
        // initialParams={{setIsSignedIn}}
      />
      <Stack.Screen
        component={ImageSlider}
        name={'ImageSlider'}
        options={navigationOptions}
      />
      <Stack.Screen
        component={DocumentationScreen}
        name={'DocumentationScreen'}
        options={navigationOptions}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
