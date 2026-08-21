// Web replacement for @sentry/react-native, aliased in webpack.config.js
// The React Native SDK has no browser build, so web uses @sentry/react instead. Everything this app calls
// (init, captureException, captureMessage, setUser) exists in both, apart from wrap, which is React Native only.

export * from '@sentry/react';

// React Native's wrap adds an error boundary and a profiler around the root component. @sentry/react has no
// equivalent single call, and App.js only needs the component back, so hand it through untouched.
export const wrap = RootComponent => RootComponent;
