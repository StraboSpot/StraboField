#!/usr/bin/env node

// Publishes an OTA update to the StraboSpot update server. Exports the JS bundle, works out each platform's runtime
// version and hands both to ota-publish.mjs (from the server side), which signs the update with our private key and
// uploads it.
//
//   npm run ota:publish -- --channel beta --message "What changed" [--platform ios|android] [--dry-run]
//
// --channel is required on purpose: "production" reaches every store build, "beta" only builds that send that
// channel header. The publish token comes from ota_publish_token in secrets.json (or OTA_TOKEN). The private key
// defaults to ~/.strabofield/ota-signing-keys/private-key.pem; set OTA_KEY to use another. Publish after making the
// build an update is meant for: phones ignore updates dated before their build.

const {execFileSync} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {getPublishEnv} = require('./token');

const ROOT = path.join(__dirname, '..', '..');
const DIST = 'dist-ota';   // Not dist/, which is the web build
const KEY = process.env.OTA_KEY || path.join(os.homedir(), '.strabofield', 'ota-signing-keys', 'private-key.pem');
// What the runtime version is computed from (see fingerprint.config.js)
const NATIVE_PATHS = ['ios', 'android', 'modules', 'patches', 'package.json', 'yarn.lock', 'app.json', '.gitignore'];

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const channel = getArg('channel');
const message = getArg('message');
const platform = getArg('platform') || 'all';
const isDryRun = args.includes('--dry-run');

const fail = (msg) => {
  console.error(`ota:publish: ${msg}`);
  process.exit(1);
};
if (!channel) fail('--channel is required (beta for test builds, production for store builds)');
if (!message) fail('--message is required');
if (!['all', 'ios', 'android'].includes(platform)) fail('--platform must be ios, android or all');
if (!fs.existsSync(KEY)) fail(`no private key at ${KEY} (set OTA_KEY to its path)`);
const publishEnv = getPublishEnv();

const platforms = platform === 'all' ? ['ios', 'android'] : [platform];
const readOutput = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs,
  {cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit']});
const run = (cmd, cmdArgs, env) => execFileSync(cmd, cmdArgs, {cwd: ROOT, env, stdio: 'inherit'});

// The runtime version is worked out from the files as they are now, committed or not, so it only matches a build
// made from this same state
const uncommitted = readOutput('git', ['status', '--porcelain', '--', ...NATIVE_PATHS]).trim();
if (uncommitted) {
  console.warn('ota:publish: uncommitted changes in files the runtime version depends on:\n' + uncommitted
    + '\nThe update will only reach a build made with these exact changes.\n');
}

// The same calculation the native build runs
const runtimeVersions = Object.fromEntries(platforms.map((p) => {
  const output = readOutput('npx', ['expo-updates', 'runtimeversion:resolve', '--platform', p]);
  return [p, JSON.parse(output.trim().split('\n').pop()).runtimeVersion];
}));
platforms.forEach(p => console.log(`${p} runtime version: ${runtimeVersions[p]}`));

fs.rmSync(path.join(ROOT, DIST), {recursive: true, force: true});
run('npx', ['expo', 'export', ...platforms.flatMap(p => ['--platform', p]), '--output-dir', DIST]);

run(process.execPath, [
  path.join(__dirname, 'ota-publish.mjs'), 'publish',
  '--dist', DIST,
  '--platform', platform,
  ...platforms.flatMap(p => [`--runtime-${p}`, runtimeVersions[p]]),
  '--key', KEY,
  '--channel', channel,
  '--message', message,
  ...(isDryRun ? ['--dry-run'] : []),
], publishEnv);

console.log('\nTo check what a phone on this build would get:');
platforms.forEach(p => console.log(
  `  npm run ota:check -- --platform ${p} --runtime ${runtimeVersions[p]} --channel ${channel}`));
