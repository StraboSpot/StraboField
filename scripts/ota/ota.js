#!/usr/bin/env node

// Runs ota-publish.mjs with the publish token from secrets.json, for its list, show, withdraw, restore, republish,
// rollback-to-embedded and stats commands (see the top of ota-publish.mjs):
//
//   npm run ota -- list --channel beta
//
// Publish with `npm run ota:publish` (publish.js) instead, which also exports the bundle and works out the runtime
// versions.

const {spawnSync} = require('child_process');
const path = require('path');

const {getPublishEnv} = require('./token');

const result = spawnSync(process.execPath, [path.join(__dirname, 'ota-publish.mjs'), ...process.argv.slice(2)],
  {env: getPublishEnv(), stdio: 'inherit'});
process.exit(result.status ?? 1);
