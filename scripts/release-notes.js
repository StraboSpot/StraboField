#!/usr/bin/env node
/**
 * Generate the user-facing store release notes from the CURATED notes in
 * src/assets/releaseNotes.js — the same source the in-app "What's New" modal uses.
 * (It no longer scrapes git commit subjects, so it can't resurrect reverted or
 * internal work: whatever the About page shows is exactly what the stores get.)
 *
 * "What's New" is cumulative: users updating from an older store version need to hear
 * about every release since the one they have, not just the version being shipped. So
 * this aggregates every releaseNotes.js entry newer than the CURRENT STORE VERSION up
 * to the shipping version, merging same-titled groups (newest items first).
 *
 * The store version is resolved in this order:
 *   1. --since=X.Y.Z flag or STORE_VERSION env var (deterministic; use in CI/offline)
 *   2. the live App Store version, looked up from the public iTunes API
 *   3. if neither is available, falls back to just the shipping version's entry (with a warning)
 * The App Store and Play live versions can differ by a patch, but the 2.29.x hotfix line
 * carries no releaseNotes.js entries, so a single lower bound selects the same entries for
 * both — one lookup is enough. Override with --since if that ever stops holding.
 *
 * Writes the files fastlane reads for store uploads:
 *   - App Store (deliver): fastlane/metadata/en-US/release_notes.txt        (grouped, <= 4000 chars)
 *   - Play (supply):       fastlane/metadata/android/en-US/changelogs/<versionCode>.txt (<= 500 chars)
 * When the aggregated notes exceed a store's cap, they are trimmed to fit and a
 * "Full notes: <GitHub release>" link is appended so users can read the rest.
 *
 * Also writes WHAT_TO_TEST.md at the repo root — a tester-facing rendering of the same curated
 * notes, refreshed on every run for paste into TestFlight / Play testing notes. It is gitignored
 * (a local aid, not a tracked artifact), so any hand-edits are overwritten on the next run.
 *
 * Usage:
 *   node scripts/release-notes.js                 # ship the package.json version, since = live store version
 *   node scripts/release-notes.js 2.31.0          # target a specific shipping entry
 *   node scripts/release-notes.js --since=2.29.15 # pin the lower bound (skips the store lookup)
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
const IOS_BUNDLE_ID = 'org.StraboSpot2'; // for the public App Store version lookup

function readVersion() {
  return require(path.join(ROOT, 'package.json')).version;
}

function readVersionCode() {
  const gradle = fs.readFileSync(path.join(ROOT, 'android/app/build.gradle'), 'utf8');
  const m = gradle.match(/versionCode\s+(\d+)/);
  return m ? m[1] : null;
}

// Compare two "x.y.z" version strings numerically; returns -1, 0, or 1.
function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff) return diff < 0 ? -1 : 1;
  }
  return 0;
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

// The GitHub release page for a version, derived from the commit base URL in releaseNotes.js.
function releaseUrl(commitBaseUrl, version) {
  return `${commitBaseUrl.replace(/\/commit\/?$/, '/releases/tag/')}v${version}`;
}

// Look up the live App Store version via the public iTunes lookup API. Returns null on any failure
// (offline, rate-limited, app not found) so the caller can fall back without breaking the build.
async function fetchAppStoreVersion() {
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?bundleId=${IOS_BUNDLE_ID}&country=us`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.version ?? null;
  }
  catch {
    return null;
  }
}

// Merge the groups of several release entries into one deduplicated, ordered list. Entries are
// passed newest-first, so the newest release's group titles lead and, within a title, its items
// come first.
function mergeGroups(entries) {
  const byTitle = new Map();
  for (const entry of entries) {
    for (const group of entry.groups) {
      if (!byTitle.has(group.title)) byTitle.set(group.title, []);
      byTitle.get(group.title).push(...group.items);
    }
  }
  return [...byTitle].map(([title, items]) => ({title, items}));
}

// The lead-in before the first colon, used as a compact label in the (tiny) Play notes.
const label = (text) => {
  const i = text.indexOf(':');
  return i === -1 ? text : text.slice(0, i);
};

// App Store: mirror the modal — an uppercase heading per group, then a bullet per item. If the full
// text overflows the cap, keep as many leading groups as fit alongside a "Full notes" link + footer.
function appStoreText(groups, notesUrl) {
  if (!groups.length) return `Stability and reliability improvements.\n\n${FOOTER}`;
  const blocks = groups.map(g =>
    [g.title.toUpperCase(), ...g.items.map(i => `• ${i.text}`)].join('\n'),
  );
  const full = `${blocks.join('\n\n')}\n\n${FOOTER}`;
  if (full.length <= APP_STORE_LIMIT) return full;

  const tail = `\n\nFull notes: ${notesUrl}\n\n${FOOTER}`;
  const kept = [];
  for (const block of blocks) {
    if ([...kept, block].join('\n\n').length + tail.length <= APP_STORE_LIMIT) kept.push(block);
    else break;
  }
  return kept.join('\n\n') + tail;
}

// Play: one compact line per group (title + item labels), packed to fit the 500-char cap. On
// overflow, append a "Full notes" link instead of the footer so users can read the rest.
function playText(groups, version, notesUrl) {
  const header = `StraboField ${version}\n\n`;
  if (!groups.length) return `${header}• Stability and reliability improvements`;

  const lines = groups.map(g => `• ${g.title}: ${g.items.map(i => label(i.text)).join('; ')}`);
  const link = `Full notes: ${notesUrl}`;
  const fits = arr => header.length + arr.join('\n').length <= PLAY_LIMIT;

  const kept = [];
  let overflow = false;
  for (const line of lines) {
    if (fits([...kept, line])) kept.push(line);
    else {
      overflow = true;
      break;
    }
  }
  if (overflow) {
    while (kept.length && !fits([...kept, '', link])) kept.pop();
    return `${header}${[...kept, '', link].join('\n')}`;
  }
  let out = header + kept.join('\n');
  if (out.length + 2 + FOOTER.length <= PLAY_LIMIT) out += `\n\n${FOOTER}`;
  return out;
}

// WHAT_TO_TEST.md: a tester-facing rendering of the same curated highlights — a heading per group,
// a bullet per item — for paste into TestFlight / Play testing notes.
function whatToTestText(groups, version, versionCode) {
  const header = `# What to Test — StraboField ${version} (build ${versionCode})\n\n`
    + 'New in this build — please exercise each area and report anything off, with your device model and OS version.\n';
  if (!groups.length) return `${header}\n- General stability and reliability improvements.\n`;
  const blocks = groups.map(g =>
    [`## ${g.title}`, ...g.items.map(i => `- ${i.text}`)].join('\n'),
  );
  return `${header}\n${blocks.join('\n\n')}\n`;
}

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, contents.endsWith('\n') ? contents : `${contents}\n`);
}

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      flags[key] = value ?? true;
    }
    else {
      positional.push(arg);
    }
  }
  return {flags, positional};
}

async function main() {
  const version = readVersion();
  const versionCode = readVersionCode();
  const {RELEASE_NOTES, COMMIT_BASE_URL} = loadReleaseNotes();

  const {flags, positional} = parseArgs(process.argv.slice(2));
  const target = positional[0] || version;
  if (!RELEASE_NOTES.some(r => r.version === target)) {
    console.error(`\n❌ No release entry for ${target} in src/assets/releaseNotes.js.`);
    console.error(`   Available: ${RELEASE_NOTES.map(r => r.version).join(', ')}\n`);
    process.exit(1);
  }

  // Resolve the lower bound: explicit override, else the live App Store version.
  const override = flags.since || process.env.STORE_VERSION || null;
  const storeVersion = override || await fetchAppStoreVersion();
  const sinceSource = override ? (flags.since ? '--since' : 'STORE_VERSION') : (storeVersion ? 'App Store' : 'none');

  // Every entry newer than the store version, up to and including the shipping target, newest first.
  let entries = storeVersion
    ? RELEASE_NOTES.filter(r => compareVersions(r.version, storeVersion) > 0 && compareVersions(r.version, target) <= 0)
    : RELEASE_NOTES.filter(r => r.version === target);
  if (!entries.length) entries = RELEASE_NOTES.filter(r => r.version === target); // store already at/ahead of target
  entries.sort((a, b) => compareVersions(b.version, a.version));

  const groups = mergeGroups(entries);
  const notesUrl = releaseUrl(COMMIT_BASE_URL, target);

  const appStore = appStoreText(groups, notesUrl);
  const play = playText(groups, target, notesUrl);
  const whatToTest = whatToTestText(groups, target, versionCode);

  const appFile = path.join(ROOT, 'fastlane/metadata/en-US/release_notes.txt');
  const playFile = path.join(ROOT, `fastlane/metadata/android/en-US/changelogs/${versionCode || 'draft'}.txt`);
  const whatToTestFile = path.join(ROOT, 'WHAT_TO_TEST.md');
  write(appFile, appStore);
  write(playFile, play);
  write(whatToTestFile, whatToTest);

  const rel = p => path.relative(ROOT, p);
  const range = storeVersion && compareVersions(storeVersion, target) < 0 ? `${storeVersion} → ${target}` : target;
  const covered = entries.map(e => e.version).join(', ');
  console.log(`\n📝 Store notes for v${target} (versionCode ${versionCode}) from src/assets/releaseNotes.js`);
  console.log(`   Store version: ${storeVersion || 'unknown'} (via ${sinceSource}) · covering ${range} · entries: ${covered}\n`);
  if (!storeVersion) console.log('⚠️  Could not determine the store version — generated notes for the shipping version only. Pass --since=X.Y.Z to set the range.\n');
  console.log(`── App Store Connect ── ${rel(appFile)}   [${appStore.length}/${APP_STORE_LIMIT} chars]`);
  console.log(appStore);
  console.log(`\n── Google Play ── ${rel(playFile)}   [${play.length}/${PLAY_LIMIT} chars]`);
  console.log(play);
  console.log(`\n── What to Test (gitignored) ── ${rel(whatToTestFile)}`);
  if (target !== version) {
console.log(
    `\nℹ️  Generated for ${target}, but package.json is ${version} — the Play file is still named for versionCode ${versionCode}.`);
}
  console.log('');
}

main();
