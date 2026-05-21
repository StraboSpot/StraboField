#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const pkg = require('../package.json');
const env = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'env.json'), 'utf8'));

const release = 'org.StraboSpot2-' + pkg.version;
const sentryEnv = {
  ...process.env,
  SENTRY_AUTH_TOKEN: env.sentry_organization_auth_token,
  SENTRY_ORG: 'university-of-kansas',
  SENTRY_PROJECT: 'strabospot-2',
};

const run = cmd => execSync(cmd, {stdio: 'inherit', env: sentryEnv});

const command = process.argv[2];

switch (command) {
  case 'release:new':
    run(`sentry-cli releases new ${release}`);
    break;
  case 'release:finalize':
    run(`sentry-cli releases finalize ${release}`);
    break;
  case 'upload:ios':
    try { run(`sentry-cli releases new ${release}`); }
    catch { console.log('Release may already exist'); }
    run(`sentry-cli sourcemaps upload --release ${release} --dist ${release} --strip-prefix . ios/main.jsbundle.map`);
    run(`sentry-cli releases finalize ${release}`);
    break;
  case 'upload:android':
    try { run(`sentry-cli releases new ${release}`); }
    catch { console.log('Release may already exist'); }
    run(`sentry-cli sourcemaps upload --release ${release} --dist ${release} --strip-prefix . android/index.android.bundle.map`);
    run(`sentry-cli releases finalize ${release}`);
    break;
  default:
    console.error('Unknown command:', command);
    process.exit(1);
}
