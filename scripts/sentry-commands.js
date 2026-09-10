#!/usr/bin/env node

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const secrets = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'secrets.json'), 'utf8'));

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
  // env.json is gitignored, so CI has no token in it — fall back to the environment for that case.
  SENTRY_AUTH_TOKEN: secrets.sentry_organization_auth_token || process.env.SENTRY_AUTH_TOKEN,
  SENTRY_ORG: 'university-of-kansas',
  SENTRY_PROJECT: 'strabospot-2',
};

const run = cmd => execSync(cmd, {stdio: 'inherit', env: sentryEnv});

const distDirectory = path.join(__dirname, '..', 'dist');

// Creating a release that already exists is the normal case on a second upload for the same version, so a failure
// here is not worth stopping for — the real errors surface from the upload itself. sentry-cli prints its own reason.
const withRelease = (upload) => {
  try {
    run(`sentry-cli releases new ${release}`);
  }
  catch {
    console.log(`Could not create release ${release}; continuing in case it already exists`);
  }
  upload();
  run(`sentry-cli releases finalize ${release}`);
};

// The url-prefix has to match the frame URLs the app reports (app:///main.jsbundle), or Sentry finds the artifacts
// but cannot tie them to the stack trace. --wait fails the command on a processing error rather than exiting 0.
const uploadSourcemaps = ({bundle, dist, sourcemap}) => withRelease(() =>
  run(`sentry-cli sourcemaps upload --release ${release} --dist ${dist} --url-prefix app:/// `
    + `--strip-common-prefix --wait --bundle ${bundle} --bundle-sourcemap ${sourcemap}`));

// Web ships several chunks rather than one bundle, so the whole dist directory is uploaded. sourcemaps inject
// stamps matching debug ids into the JS and the maps, which is how Sentry pairs them — it must run before the
// files are deployed. The maps are deleted even when the upload is skipped or fails, so a hidden-source-map build
// can never publish the source; recovering from a failure means rebuilding, which is the safer way round.
const uploadWebSourcemaps = () => {
  if (!fs.existsSync(distDirectory)) throw new Error('No dist directory — run the web build before uploading');
  try {
    // web-deploy runs this, and not every machine that builds web has a Sentry token, so a missing one is not fatal.
    if (!sentryEnv.SENTRY_AUTH_TOKEN) {
      console.log('No sentry_organization_auth_token in env.json — skipping the sourcemap upload.'
        + ' Web errors will still be reported, but their stack traces will not be readable.');
      return;
    }
    withRelease(() => {
      run(`sentry-cli sourcemaps inject ${distDirectory}`);
      run(`sentry-cli sourcemaps upload --release ${release} --wait ${distDirectory}`);
    });
  }
  finally {
    const maps = fs.readdirSync(distDirectory).filter(file => file.endsWith('.map'));
    maps.forEach(file => fs.unlinkSync(path.join(distDirectory, file)));
    console.log(`Deleted ${maps.length} sourcemap(s) from dist so they are not deployed`);
  }
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
  case 'upload:web':
    uploadWebSourcemaps();
    break;
  default:
    console.error('Unknown command:', command);
    process.exit(1);
}
