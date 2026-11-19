const {SourceSkips} = require('expo/fingerprint');

// The runtime version is a fingerprint of the native code, and an OTA update only reaches builds whose runtime
// version matches. By default the fingerprint also covers package.json's "scripts", none of which go into a build,
// so adding or editing an npm script would cut every existing build off from updates. Read by both the native
// build and `npx expo-updates runtimeversion:resolve` (scripts/ota/publish.js), so the two keep agreeing.
/** @type {import('expo/fingerprint').Config} */
module.exports = {
  sourceSkips: SourceSkips.PackageJsonScriptsAll,
};
