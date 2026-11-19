const {SourceSkips} = require('expo/fingerprint');

// The runtime version is a fingerprint of the native code, and an OTA update only reaches builds whose runtime
// version matches. Read by both the native build and `npx expo-updates runtimeversion:resolve`
// (scripts/ota/publish.js), so the two keep agreeing. Anything hashed here that changes without the native code
// changing gives a build a runtime version no update is published for, and that build silently gets no updates.
/** @type {import('expo/fingerprint').Config} */
module.exports = {
  // package.json's "scripts" don't go into a build, so editing an npm script mustn't cut builds off from updates
  sourceSkips: SourceSkips.PackageJsonScriptsAll,
  // The fingerprint hashes everything under ios/ and android/, .gitignore'd files included
  ignorePaths: [
    // JS bundles and sourcemaps written by `npm run bundle:ios` / `bundle:android`: they change with every JS change
    'ios/main.jsbundle',
    'ios/main.jsbundle.map',
    'android/app/src/main/assets/index.android.bundle',
    'android/index.android.bundle.map',
    // IDE and per-user state, which Xcode and Android Studio rewrite as they're used
    'android/.idea/**',
    'ios/*.xcodeproj/xcuserdata/**',
    'ios/*.xcworkspace/xcuserdata/**',
    'ios/*.xcodeproj/xcshareddata/xcschemes/**',
    // Machine-specific settings and signing secrets, which don't change what the native code can run
    'android/local.properties',
    'android/keystore.properties',
    'android/app/upload-keystore.jks',
    'android/sentry.properties',
    'ios/sentry.properties',
  ],
};
