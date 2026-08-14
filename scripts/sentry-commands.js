#!/usr/bin/env node

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const env = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'env.json'), 'utf8'));

// Must match RELEASE_NAME in src/shared/app.constants.js, which the app reports on every event. Sentry release
// names are case-sensitive, so deriving both from package.json keeps uploaded sourcemaps attached to a release
// that events actually report — hardcoding the name here silently orphaned every upload.
const release = `org.${pkg.name}-${pkg.version}`;

// The dist must match DeviceInfo.getBuildNumber() in App.js, so that several builds sharing one version number keep
// their sourcemaps apart. iOS and Android number their builds independently, hence one reader per platform.
const readBuildNumber = (file, pattern) => {
  const match = fs.readFileSync(path.join(__dirname, '..', file), 'utf8').match(pattern);
  if (!match) throw new Error(`Could not read a build number from ${file}`);
  return match[1];
};

const iosBuildNumber = () => readBuildNumber('ios/StraboSpot2/Info.plist',
  /<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/);
const androidBuildNumber = () => readBuildNumber('android/app/build.gradle', /versionCode\s+(\d+)/);

const sentryEnv = {
  ...process.env,
  SENTRY_AUTH_TOKEN: env.sentry_organization_auth_token,
  SENTRY_ORG: 'university-of-kansas',
  SENTRY_PROJECT: 'strabospot-2',
};

const run = cmd => execSync(cmd, {stdio: 'inherit', env: sentryEnv});

// The url-prefix has to match the frame URLs the app reports (app:///main.jsbundle), or Sentry finds the artifacts
// but cannot tie them to the stack trace. --wait fails the command on a processing error rather than exiting 0.
const uploadSourcemaps = ({bundle, dist, sourcemap}) => {
  try {
    run(`sentry-cli releases new ${release}`);
  }
  catch {
    console.log('Release may already exist');
  }
  run(`sentry-cli sourcemaps upload --release ${release} --dist ${dist} --url-prefix app:/// `
    + `--strip-common-prefix --wait --bundle ${bundle} --bundle-sourcemap ${sourcemap}`);
  run(`sentry-cli releases finalize ${release}`);
};

const command = process.argv[2];

switch (command) {
  case 'release:new':
    run(`sentry-cli releases new ${release}`);
    break;
  case 'release:finalize':
    run(`sentry-cli releases finalize ${release}`);
    break;
  case 'upload:ios':
    uploadSourcemaps({
      bundle: 'ios/main.jsbundle',
      dist: iosBuildNumber(),
      sourcemap: 'ios/main.jsbundle.map',
    });
    break;
  case 'upload:android':
    uploadSourcemaps({
      bundle: 'android/app/src/main/assets/index.android.bundle',
      dist: androidBuildNumber(),
      sourcemap: 'android/index.android.bundle.map',
    });
    break;
  default:
    console.error('Unknown command:', command);
    process.exit(1);
}
