#!/usr/bin/env node
/**
 * Generate DRAFT user-facing store release notes from the commit range since the
 * previous release tag.
 *
 * This gathers + templates the notes; it does NOT write polished marketing copy.
 * The commit subjects are cleaned, grouped, and bulleted, but you should still
 * review/rewrite the result (ask Claude to "polish the store notes") before shipping.
 *
 * Writes the files fastlane reads for store uploads:
 *   - App Store (deliver): fastlane/metadata/en-US/release_notes.txt
 *   - Play (supply):       fastlane/metadata/android/en-US/changelogs/<versionCode>.txt
 *
 * Usage:
 *   node scripts/release-notes.js            # auto-detect previous release tag
 *   node scripts/release-notes.js v2.29.12   # override the "from" tag
 */

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLAY_LIMIT = 500; // hard cap enforced by Google Play
const PLAY_TARGET = 400; // our preferred ceiling

const sh = cmd => execSync(cmd, {cwd: ROOT}).toString().trim();

// Map a conventional-commit scope to a user-facing category heading.
const CATEGORY = {
  'map': 'Maps', 'maps': 'Maps',
  'image': 'Photos', 'images': 'Photos', 'sketch': 'Photos',
  'form': 'Forms', 'forms': 'Forms',
  'notebook': 'Notebook', 'notebook-menu': 'Notebook', 'notebook-panel': 'Notebook',
  'spot': 'Spots', 'spots': 'Spots', 'samples': 'Spots',
  'strat section': 'Strat sections', 'strat': 'Strat sections',
  'compass': 'Compass',
  'project': 'Projects', 'projects': 'Projects', 'backup': 'Backup & sync',
  'connectivity': 'Sync', 'network': 'Sync',
};

// Commit types that describe user-visible change. Everything else is dropped.
const USER_TYPES = new Set(['feat', 'fix']);

function readVersion() {
  return require(path.join(ROOT, 'package.json')).version;
}

function readVersionCode() {
  const gradle = fs.readFileSync(path.join(ROOT, 'android/app/build.gradle'), 'utf8');
  const m = gradle.match(/versionCode\s+(\d+)/);
  return m ? m[1] : null;
}

const semver = t => t.replace(/^v/, '').split('.').map(Number);
const lt = (a, b) => {
  const [A, B] = [semver(a), semver(b)];
  for (let i = 0; i < 3; i++) {
    if ((A[i] || 0) !== (B[i] || 0)) return (A[i] || 0) < (B[i] || 0);
  }
  return false;
};

// Highest well-formed vX.Y.Z tag strictly below the current version.
// Deliberately ignores malformed tags (e.g. v129.0, 2.16.2, *-draft, *rc).
function previousTag(currentVersion) {
  const tags = sh('git tag')
    .split('\n')
    .filter(t => /^v\d+\.\d+\.\d+$/.test(t));
  const below = tags.filter(t => lt(t, `v${currentVersion}`));
  below.sort((a, b) => (lt(a, b) ? -1 : 1));
  return below[below.length - 1] || null;
}

function subjects(fromTag) {
  const range = fromTag ? `${fromTag}..HEAD` : 'HEAD';
  return sh(`git log ${range} --no-merges --pretty=format:%s`)
    .split('\n')
    .filter(Boolean);
}

// "fix(map): render point symbols reliably on web" -> {category, text}
function parse(subject) {
  const m = subject.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
  if (!m) return null;
  const [, type, scope, msgRaw] = m;
  if (!USER_TYPES.has(type)) return null;
  let msg = msgRaw.replace(/\s*\(#\d+\)\s*$/, '').replace(/\.$/, '').trim();
  // Drop obviously internal noise even when tagged fix/feat.
  if (/(sourcemap|sentry|__DEV__|webpack|env\.json|eslint|typescript|ci\b)/i.test(msg)) return null;
  if (['web', 'config', 'ci', 'build', 'deps'].includes(scope)) return null;
  const category = (scope && CATEGORY[scope.toLowerCase()]) || 'Improvements';
  msg = msg.charAt(0).toUpperCase() + msg.slice(1);
  return {category, text: msg};
}

function group(items) {
  const byCat = new Map();
  for (const it of items) {
    if (!byCat.has(it.category)) byCat.set(it.category, []);
    const list = byCat.get(it.category);
    if (!list.includes(it.text)) list.push(it.text); // de-dupe
  }
  // Push the catch-all category last.
  return [...byCat.entries()].sort((a, b) =>
    a[0] === 'Improvements' ? 1 : b[0] === 'Improvements' ? -1 : a[0].localeCompare(b[0]),
  );
}

function appStoreText(groups) {
  if (!groups.length) return 'Stability and reliability improvements. Thanks for using StraboSpot!';
  return groups
    .map(([cat, msgs]) => `• ${cat}: ${msgs.join('; ')}`)
    .join('\n');
}

function playText(groups) {
  if (!groups.length) return 'Stability and reliability improvements. Thanks for using StraboSpot!';
  const lines = groups.map(([cat, msgs]) => `• ${cat}: ${msgs.join('; ')}`);
  let out = lines.join('\n');
  // Trim category detail until under the target, then hard-cap.
  while (out.length > PLAY_TARGET && lines.length > 1) {
    lines.pop();
    out = lines.join('\n') + '\n• Plus other fixes and improvements';
  }
  if (out.length > PLAY_LIMIT) out = out.slice(0, PLAY_LIMIT - 1).trimEnd() + '…';
  return out;
}

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, contents.endsWith('\n') ? contents : contents + '\n');
}

function main() {
  const version = readVersion();
  const versionCode = readVersionCode();
  const fromTag = process.argv[2] || previousTag(version);

  const parsed = subjects(fromTag).map(parse).filter(Boolean);
  const groups = group(parsed);

  const appStore = appStoreText(groups);
  const play = playText(groups);

  const appFile = path.join(ROOT, 'fastlane/metadata/en-US/release_notes.txt');
  const playFile = path.join(
    ROOT,
    `fastlane/metadata/android/en-US/changelogs/${versionCode || 'draft'}.txt`,
  );
  write(appFile, appStore);
  write(playFile, play);

  const rel = p => path.relative(ROOT, p);
  console.log(`\n📝 DRAFT store notes for v${version} (versionCode ${versionCode})`);
  console.log(`   range: ${fromTag ? `${fromTag}..HEAD` : 'full history'}  (${parsed.length} user-facing commits)\n`);
  console.log(`── App Store Connect ── ${rel(appFile)}`);
  console.log(appStore);
  console.log(`\n── Google Play ── ${rel(playFile)}   [${play.length}/${PLAY_TARGET} chars]`);
  console.log(play);
  if (play.length > PLAY_TARGET) console.log(`⚠️  Over the ${PLAY_TARGET}-char target — trim before shipping.`);
  console.log('\n⚠️  DRAFT ONLY — review/rewrite for a general audience (ask Claude to "polish the store notes") before uploading.\n');
}

main();
