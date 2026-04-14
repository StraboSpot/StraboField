// Web stub for @react-navigation/stack/lib/module/views/Screens.js
// Replaces the native version that calls require('react-native-screens') at runtime.
// Navigation falls back to plain View wrappers, which is the intended web behavior.
import React from 'react';
import {View} from 'react-native';

export const MaybeScreenContainer = ({enabled, ...rest}) => React.createElement(View, rest);
export const MaybeScreen = ({enabled, active, ...rest}) => React.createElement(View, rest);
