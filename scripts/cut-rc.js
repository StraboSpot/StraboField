#!/usr/bin/env node
/**
 * Mark a changelog "cut": tag the current package.json version as `v{version}-rc` and push it.
 *
 * This freezes the boundary between one version's draft and the next. Everything committed BEFORE
 * this tag belongs to `{version}`; everything committed AFTER it rolls into the next version's draft.
 * The draft workflow (.github/workflows/rc-draft.yml) reads these markers to slice the log, so it no
 * longer matters that `master` (the 2.29.x hotfix line) gets merged in and makes package.json's
 * version oscillate along the branch.
 *
 * Run it right when you finalize a patch/beta on the rc branch, after its commits are pushed:
 *   npm run cut-rc
 *
 * The real published release still gets its plain `v{version}` tag on master at publish time.
 */

const {execSync} = require('child_process');

const version = require('../package.json').version;
const tag = `v${version}-rc`;

const run = cmd => execSync(cmd, {stdio: 'inherit'});
const exists = () => {
  try {
    execSync(`git rev-parse -q --verify refs/tags/${tag}`, {stdio: 'ignore'});
    return true;
  }
  catch {
    return false;
  }
};

if (exists()) {
  console.error(`\n⚠️  Tag ${tag} already exists — this version was already cut.`);
  console.error('   Bump to the next version before cutting again (npm run bump-patch).\n');
  process.exit(1);
}

run(`git tag ${tag}`);
run(`git push origin ${tag}`);

console.log(`\n✅ Cut marker ${tag} pushed.`);
console.log('   New commits on this branch now collect into the next version\'s draft.\n');
