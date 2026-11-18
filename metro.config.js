const {getSentryExpoConfig} = require('@sentry/react-native/metro');

/**
 * Metro configuration
 * Expo's base config (via Sentry's wrapper) so store builds (`expo export:embed`) and OTA updates (`expo export`)
 * are bundled the same way, with the asset hashing expo-updates needs.
 * https://docs.expo.dev/guides/customizing-metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getSentryExpoConfig(__dirname);

module.exports = config;
