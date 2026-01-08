// React 19 compatibility fix for react-native-reanimated
// See: https://github.com/software-mansion/react-native-reanimated/issues/8034
import React from 'react';
// import './wdyr';
import {AppRegistry, LogBox, Platform} from 'react-native';
// import 'react-native-devsettings';   // Not supported in react-native-web
import {configureReanimatedLogger, ReanimatedLogLevel} from 'react-native-reanimated';

import App from './App';
import {name as appName} from './app.json';

global.React = React;

const isWeb = Platform.select({
  native: 'Battery state `unknown` and monitoring disabled, this is normal for simulators and tvOS.',
});

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: true, // Reanimated runs in strict mode by default
});

LogBox.ignoreLogs([
  'Require cycle:',
  'Remote debugger',
  'Warning:',
  'Module RNSimpleCompass requires main queue setup since it overrides `init` but doesn\'t implement `requiresMainQueueSetup`.',
  'Sending `zipArchiveProgressEvent` with no listeners registered.',
  'currentlyFocusedField is deprecated and will be removed in a future release. Use currentlyFocusedInput',
  'Mapbox error You\'re calling ',
  isWeb,
]);

AppRegistry.registerComponent(appName, () => App);
