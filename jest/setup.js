// The App render test mounts the whole component tree, which pulls in dozens of
// native modules that have no implementation under jest. Stub them here so the
// tree can mount. Library-provided mocks are used where they exist; otherwise an
// inert component/object stands in.

import 'react-native-gesture-handler/jestSetup';
import '@rnmapbox/maps/setup-jest';

jest.mock('react-native-reanimated', () => require('./mocks/reanimated.js'));

// NetInfo's native module (RNCNetInfo) is null in the test env, so App.js's
// NetInfo.configure() throws without this.
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('./mocks/async-storage.js'),
);
jest.mock('react-native-permissions', () => require('react-native-permissions/mock'));
jest.mock('@react-native-clipboard/clipboard', () =>
  require('@react-native-clipboard/clipboard/jest/clipboard-mock.js'),
);
jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock.js'),
);

// Sentry's native SDK isn't available in the test env; stub the surface App.js uses.
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: component => component,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
}));

// Remaining native modules with no shipped mock — inert stubs so imports resolve.
jest.mock('@StraboSpot/react-native-sketch-canvas', () => 'RNSketchCanvas');
jest.mock('react-native-pdf', () => 'Pdf');
jest.mock('react-native-blob-util', () => ({}));
jest.mock('@react-native-documents/picker', () => ({}));
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  requestAuthorization: jest.fn(),
}));
jest.mock('react-native-orientation-director', () => ({}));
jest.mock('react-native-sound-player', () => ({}));
jest.mock('react-native-keep-awake', () => ({}));
jest.mock('react-native-zip-archive', () => ({}));
jest.mock('react-native-check-version', () => ({}));
