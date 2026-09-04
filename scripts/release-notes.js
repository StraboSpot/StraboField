#!/usr/bin/env node
/**
 * Generate the user-facing store release notes from the CURATED notes in
 * src/assets/releaseNotes.js — the same source the in-app "What's New" modal uses.
 * (It no longer scrapes git commit subjects, so it can't resurrect reverted or
 * internal work: whatever the About page shows is exactly what the stores get.)
 *
 * Writes the files fastlane reads for store uploads:
 *   - App Store (deliver): fastlane/metadata/en-US/release_notes.txt        (grouped, <= 4000 chars)
 *   - Play (supply):       fastlane/metadata/android/en-US/changelogs/<versionCode>.txt (<= 500 chars)
 *
 * Also writes WHAT_TO_TEST.md at the repo root — a tester-facing rendering of the same curated
 * notes, refreshed on every run for paste into TestFlight / Play testing notes. It is gitignored
 * (a local aid, not a tracked artifact), so any hand-edits are overwritten on the next run.
 *
 * It generates notes for the release entry whose `version` matches package.json (the build you're
 * shipping). Pass a version to target a different entry.
 *
 * Usage:
 *   node scripts/release-notes.js          # generate for the package.json version
 *   node scripts/release-notes.js 2.31.0   # generate for a specific release entry
 *
 * To change the wording, edit src/assets/releaseNotes.js and re-run — do NOT hand-edit the store
 * .txt files, this script overwrites them.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP_STORE_LIMIT = 4000; // hard cap enforced by App Store Connect
const PLAY_LIMIT = 500; // hard cap enforced by Google Play
const FOOTER = 'Thanks for using StraboSpot!';

function readVersion() {
  return require(path.join(ROOT, 'package.json')).version;
}

function readVersionCode() {
  const gradle = fs.readFileSync(path.join(ROOT, 'android/app/build.gradle'), 'utf8');
  const m = gradle.match(/versionCode\s+(\d+)/);
  return m ? m[1] : null;
}

// Load the curated notes without a build step: strip the ESM `export`s from the data module and
// evaluate it in an isolated function scope. The file is our own plain-data source (arrays of
// strings), so there is nothing to sandbox against.
function loadReleaseNotes() {
  const file = path.join(ROOT, 'src/assets/releaseNotes.js');
  const src = fs.readFileSync(file, 'utf8')
    .replace(/^\s*export\s+default\s+[^;]+;?\s*$/m, '')
    .replace(/export\s+const/g, 'const');
  // eslint-disable-next-line no-new-func
  return new Function(`${src}\n; return {RELEASE_NOTES, COMMIT_BASE_URL};`)();
}

// The lead-in before the first colon, used as a compact label in the (tiny) Play notes.
const label = (text) => {
  const i = text.indexOf(':');
  return i === -1 ? text : text.slice(0, i);
};

// App Store: mirror the modal — an uppercase heading per group, then a bullet per item.
function appStoreText(release) {
  if (!release.groups.length) return `Stability and reliability improvements.\n\n${FOOTER}`;
  const blocks = release.groups.map(g =>
    [g.title.toUpperCase(), ...g.items.map(i => `• ${i.text}`)].join('\n'),
  );
  return `${blocks.join('\n\n')}\n\n${FOOTER}`;
}

// Play: one compact line per group (title + item labels), packed to fit the 500-char cap.
function playText(release, version) {
  const header = `StraboField ${version}\n\n`;
  if (!release.groups.length) return `${header}• Stability and reliability improvements`;

  const lines = release.groups.map(g => `• ${g.title}: ${g.items.map(i => label(i.text)).join('; ')}`);
  const kept = [];
  let truncated = false;
  const fits = (extra) => header.length + [...kept, extra].join('\n').length <= PLAY_LIMIT;
  for (const line of lines) {
    if (fits(line)) kept.push(line);
    else {
      truncated = true;
      break;
    }
  }
  if (truncated) {
    const more = '• …and more in the app';
    while (kept.length && !fits(more)) kept.pop();
    kept.push(more);
  }
  let out = header + kept.join('\n');
  if (out.length + 2 + FOOTER.length <= PLAY_LIMIT) out += `\n\n${FOOTER}`;
  return out;
}

// WHAT_TO_TEST.md: a tester-facing rendering of the same curated highlights — a heading per group,
// a bullet per item — for paste into TestFlight / Play testing notes.
function whatToTestText(release, version, versionCode) {
  const header = `# What to Test — StraboField ${version} (build ${versionCode})\n\n` +
    'New in this build — please exercise each area and report anything off, with your device model and OS version.\n';
  if (!release.groups.length) return `${header}\n- General stability and reliability improvements.\n`;
  const blocks = release.groups.map(g =>
    [`## ${g.title}`, ...g.items.map(i => `- ${i.text}`)].join('\n'),
  );
  return `${header}\n${blocks.join('\n\n')}\n`;
}

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, contents.endsWith('\n') ? contents : `${contents}\n`);
}

function main() {
  const version = readVersion();
  const versionCode = readVersionCode();
  const {RELEASE_NOTES} = loadReleaseNotes();

  const target = process.argv[2] || version;
  const release = RELEASE_NOTES.find(r => r.version === target);
  if (!release) {
    console.error(`\n❌ No release entry for ${target} in src/assets/releaseNotes.js.`);
    console.error(`   Available: ${RELEASE_NOTES.map(r => r.version).join(', ')}\n`);
    process.exit(1);
  }

  const appStore = appStoreText(release);
  const play = playText(release, release.version);
  const whatToTest = whatToTestText(release, release.version, versionCode);

  const appFile = path.join(ROOT, 'fastlane/metadata/en-US/release_notes.txt');
  const playFile = path.join(ROOT, `fastlane/metadata/android/en-US/changelogs/${versionCode || 'draft'}.txt`);
  const whatToTestFile = path.join(ROOT, 'WHAT_TO_TEST.md');
  write(appFile, appStore);
  write(playFile, play);
  write(whatToTestFile, whatToTest);

  const rel = (p) => path.relative(ROOT, p);
  console.log(`\n📝 Store notes for v${release.version} (versionCode ${versionCode}) from src/assets/releaseNotes.js\n`);
  console.log(`── App Store Connect ── ${rel(appFile)}   [${appStore.length}/${APP_STORE_LIMIT} chars]`);
  console.log(appStore);
  if (appStore.length > APP_STORE_LIMIT) console.log(`⚠️  Over the ${APP_STORE_LIMIT}-char App Store cap — trim releaseNotes.js.`);
  console.log(`\n── Google Play ── ${rel(playFile)}   [${play.length}/${PLAY_LIMIT} chars]`);
  console.log(play);
  console.log(`\n── What to Test (gitignored) ── ${rel(whatToTestFile)}`);
  if (target !== version) console.log(`\nℹ️  Generated for ${target}, but package.json is ${version} — the Play file is still named for versionCode ${versionCode}.`);
  console.log('');
}

main();
