import React from 'react';

import {createStackNavigator} from '@react-navigation/stack';

import {NAVIGATION_OPTIONS} from './routes.constants';
import SignIn from '../modules/sign-in/SignIn';
import SignUp from '../modules/sign-up/SignUp';

const AuthStack = () => {
  /* Derived Variables */

  const Stack = createStackNavigator();

  /* View */

  return (
    <Stack.Navigator>
      <Stack.Screen
        component={SignIn}
        name={'SignIn'}
        options={NAVIGATION_OPTIONS}
        // initialParams={{setIsSignedIn}}
      />
      <Stack.Screen
        component={SignUp}
        name={'SignUp'}
        options={NAVIGATION_OPTIONS}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
