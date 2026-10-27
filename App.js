import React from 'react';
import {Platform, StatusBar} from 'react-native';

import * as NetInfo from '@react-native-community/netinfo';
import {NavigationContainer} from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import DeviceInfo from 'react-native-device-info';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';

import installGlyphs from './src/modules/maps/glyphs/installGlyphs';
import ConnectionStatus from './src/modules/status-bar/ConnectionStatus';
import ProfileSyncListener from './src/modules/user/ProfileSyncListener';
import Routes from './src/routes/Routes';
import MacrostratAuthRedirectHandler from './src/services/data-intergration/macrostrat/MacrostratAuthRedirectHandler';
import {RELEASE_NAME} from './src/shared/app.constants';
import {SMALL_SCREEN} from './src/shared/styles.constants';
import AppErrorFallback from './src/shared/ui/AppErrorFallback';
import ToastWrapper from './src/shared/ui/ToastWrapper';
import uiStyles from './src/shared/ui/ui.styles';
import {persistor, store} from './src/store/ConfigureStore';
import config from './src/utils/config';

let didInit = false;

// Web resolves @sentry/react-native to src/web/stubs/sentry.web.js, which is @sentry/react. It shares these
// options but none of the native ones below, and has no build number to report as dist.
const sentryOptions = {
  dsn: config.get('Error_reporting_DSN'),
  debug: false,
  environment: __DEV__ ? 'development' : 'production',
  release: RELEASE_NAME,
  tracesSampleRate: 0,
};

if (Platform.OS === 'web') Sentry.init(sentryOptions);
else {
  Sentry.init({
    ...sentryOptions,
    enableNative: true,
    enableAppHangTracking: false,
    dist: DeviceInfo.getBuildNumber(), // must match the --dist that scripts/sentry-commands.js uploads with
    autoSessionTracking: true,
    enableAutoPerformanceTracing: false,
    enableAutoSessionTracking: false,
    // _experiments: {
    //   profilesSampleRate: 0.50,
    //   replaysSessionSampleRate: __DEV__ ? 1.0 : 0.5,
    //   replaysOnErrorSampleRate: 1.0,
    // },
    integrations: [
      //   Sentry.mobileReplayIntegration(),
    ],
  });
  // TEMP diagnostic: proves which JS bundle is running. If a crash event carries this tag, the modal-serialization
  // changes are loaded; if it is absent, the app is running a stale bundle. Remove once the modal crash is confirmed fixed.
  Sentry.setTag('js_modal_fix', 'loadmodal-asview-1');
}

NetInfo.configure({
  // reachabilityUrl: 'https://clients3.google.com/generate_204',
  // reachabilityTest: async (response) => {
  //   console.log('Response Status', response.status);
  //   return response.status === 204;
  // },
  // reachabilityLongTimeout: 5 * 1000, // 60s
  // reachabilityShortTimeout: 5 * 1000, // 5s
  // reachabilityRequestTimeout: 15 * 1000, // 15s
  shouldFetchWiFiSSID: true,
});


// persistor.purge(); // Use this to clear persistStore completely

const renderErrorFallback = props => <AppErrorFallback {...props}/>;

const App = () => {

  if (Platform.OS === 'web' && !didInit) {
    console.count('Rendering App...');
    persistor.purge(); // Use this to clear persistStore completely
  }
  else console.log('Rendering App...');
  didInit = true;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={uiStyles.container}>
        {/* Catches what nothing else did - a render error, or a fatal error thrown from a timer or event handler -
            and shows AppErrorFallback in place of the app. Without it, iOS kills the app before the error reaches
            Sentry (it shows up only as a Hermes crash, e.g. STRABOSPOT-2-6GK). Outside the Provider so a broken
            store is caught too. */}
        <Sentry.GlobalErrorBoundary fallback={renderErrorFallback}>
          <Provider store={store}>
            <ToastWrapper>
              <PersistGate loading={null} onBeforeLift={installGlyphs} persistor={persistor}>
                {/*<Sentry.TouchEventBoundary>*/}
                {/* iOS sets the status bar natively (RootViewController in AppDelegate.swift); <StatusBar> there is a
                    red-box error since the appearance is view-controller-based. */}
                {Platform.OS !== 'ios' && !SMALL_SCREEN && <StatusBar hidden/>}
                <ConnectionStatus/>
                <ProfileSyncListener/>
                <MacrostratAuthRedirectHandler/>
                <NavigationContainer>
                  <Routes/>
                </NavigationContainer>
                {/*</Sentry.TouchEventBoundary>*/}
              </PersistGate>
            </ToastWrapper>
          </Provider>
        </Sentry.GlobalErrorBoundary>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Sentry.wrap(App);
