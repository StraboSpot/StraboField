#!/usr/bin/env node

const {execSync} = require('child_process');
const {version} = require('../package.json');

const run = (cmd) => execSync(cmd, {stdio: 'inherit'});

run('git add .');
run(`git commit -m "chore: bump version to ${version}"`);
run('git push origin master');

console.log(`Committed and pushed version bump to ${version}.`);
