// User-facing release notes shown in the About page "What's New" modal.
//
// An ordered list (newest release first) of what shipped in each PUBLIC release. Interim rc/patch
// builds (e.g. the 2.30.x series) are not listed individually — their changes are rolled up into the
// public release that ships them (e.g. 2.31.0). The About page shows only the releases in the running
// minor version (e.g. every 2.32.x up to 2.32.1), plus, in dev builds, not-yet-shipped ones flagged
// "unreleased", with a button to RELEASES_URL for the rest. Entries from earlier minor versions are
// removed once a new one ships; their notes stay on the GitHub Releases page.
//
// Each release's highlights are organized into `groups` of related changes: {title, items}, where
// each item is {text, commit}. `text` is the user-facing blurb (the part before the first colon is
// bolded in the modal), and `commit` is the short hash of the representative commit so users can open
// it on GitHub. A feature that spans several commits just points at its main one.
//
// Two optional item fields steer the store notes built by scripts/release-notes.js (the modal ignores them):
//   - `play`: a short blurb that marks the item as a Google Play highlight. Play's 500-char cap only
//     fits a handful, so when any release in range has `play` items, only those are listed there
//     (feature releases first) and the rest fold into a "Plus more fixes" line.
//   - `platforms`: e.g. ['ios'] or ['web'] for platform-specific items; they are left out of the other
//     platform's store notes.
//
// Add a new entry to the TOP for each public release. `version` must match the string in package.json
// once that release ships. An empty `groups` array renders "No user-facing highlights".

// All git remotes redirect to StraboSpot/StraboField; commit hashes resolve there.
export const COMMIT_BASE_URL = 'https://github.com/StraboSpot/StraboField/commit/';
export const RELEASES_URL = 'https://github.com/StraboSpot/StraboField/releases';

const RELEASE_NOTES = [
  {
    version: '2.33.0',
    groups: [
      {
        title: 'StraboSamples',
        items: [
          {
            text: 'Link to StraboSamples: link a Field sample to its StraboSamples record, comparing the two and choosing which values to keep',
            commit: '25f6b8edd',
            play: 'Link samples to StraboSamples',
          },
          {
            text: 'Linked sample details: a linked sample shows its StraboSamples data in tabs, with a button to open it online and its last-updated date',
            commit: '164cdc139',
          },
          {
            text: 'StraboMicro PDFs: linking a sample downloads its StraboMicro project PDF so the Micro tab can open it offline',
            commit: '300805b47',
          },
        ],
      },
      {
        title: 'Prepared projects',
        items: [
          {
            text: 'Prepared projects: projects prepared for you on strabospot.org, like Field Camp Wizard projects, are offered after sign-in and on the welcome screen, ready to download and install',
            commit: 'd1a13648b',
            play: 'Install projects prepared on strabospot.org',
          },
        ],
      },
      {
        title: 'App updates',
        items: [
          {
            text: 'Faster fixes: app fixes can now arrive without a store update, downloading in the background and asking to restart when ready',
            commit: 'fda735cf3',
            play: 'Fixes arrive without waiting for a store update',
            platforms: ['ios', 'android'],
          },
          {
            text: 'Checks on return: the app also checks for updates when you come back to it, not only when it starts',
            commit: 'a0ccaace6',
            platforms: ['ios', 'android'],
          },
        ],
      },
      {
        title: 'Map layers & offline maps',
        items: [
          {
            text: 'New map layers menu: each map shows a thumbnail, with its own options for an overlay switch, opacity, and centering on the map',
            commit: '3774a6e6a',
            play: 'Redesigned map layers menu with thumbnails',
          },
          {
            text: 'Offline overlays: save an overlay for offline use, not only the basemap',
            commit: 'de9ac0881',
          },
          {
            text: 'Save a whole custom map: save a custom map\'s full extent for offline use from its edit page, which also shows its offline tiles',
            commit: '90c5fec9a',
            play: 'Save overlays and whole custom maps offline',
          },
          {
            text: 'Offline map details: open a panel for each offline map showing its tiles, size, zoom levels, and location',
            commit: '128ad2f59',
          },
          {
            text: 'Preview downloads: a Preview button shows what a download covers, with a banner naming the map',
            commit: 'e5dc1e7f3',
          },
          {
            text: 'Offline viewing: downloaded custom maps can be viewed offline, and the basemap comes back after a preview',
            commit: 'c5de4cab1',
          },
        ],
      },
      {
        title: 'Drawing & map editing',
        items: [
          {
            text: 'Snap to Spots: new vertices and edits snap to the nearest vertex or edge of a nearby Spot, with an adjustable tolerance under Adding New Spots',
            commit: '108926aaa',
            play: 'Snap to Spots while drawing',
          },
          {
            text: 'Safer map edits: you\'re asked to save a map edit or interval drag before anything else can change a Spot, with Discard, Keep Editing, or Save',
            commit: '8c88ec3c1',
          },
          {
            text: 'Spot picker previews: when Spots overlap, the picker shows each one as the map draws it, with its symbol, colors and label, so you can tell them apart',
            commit: '29aedf761',
          },
        ],
      },
      {
        title: 'Notebook & forms',
        items: [
          {
            text: 'Unsaved changes prompt: leaving a notebook page with unsaved changes, by any route, asks whether to Discard, Keep Editing, or Save',
            commit: '94ddf2983',
            play: 'Never lose unsaved notebook edits',
          },
          {
            text: 'Save when changed: Save stays disabled until something on the form has changed',
            commit: 'bf8cdf355',
          },
          {
            text: 'Trace & surface features: a Trace Feature or Surface Feature section on the Overview replaces the switch, opening its form as a subpage',
            commit: '86e7b3ef7',
          },
          {
            text: 'Dismiss bar on iPhone: text fields have a Dismiss button above the keyboard to hide it',
            commit: '1eca1289a',
            platforms: ['ios'],
          },
        ],
      },
      {
        title: 'Sedimentary',
        items: [
          {
            text: 'Better sed labels: structures, diagenesis, fossils, and interpretations are labeled from the data they hold',
            commit: 'ca983bde3',
          },
        ],
      },
      {
        title: 'Backups & sync',
        items: [
          {
            text: 'Saved before sync: the open project is saved to the device before an upload or download, so recent changes can\'t be lost',
            commit: 'dfb1c6ecb',
            play: 'Project saved to the device before every sync',
          },
          {
            text: 'Manage saves: delete single saves or all of them from My Saves and Auto Saves tabs, each showing how much space it takes',
            commit: 'd54e93278',
          },
          {
            text: 'More auto saves: each project keeps its own 30 most recent auto saves, so one project no longer prunes another\'s',
            commit: 'df7a7d5be',
          },
        ],
      },
      {
        title: 'Samples & datasets',
        items: [
          {
            text: 'Samples stay with their Spot: moving a Spot moves its samples too, and a new sample is filed in its parent\'s dataset',
            commit: '0cfcfb562',
          },
        ],
      },
      {
        title: 'Fixes',
        items: [
          {
            text: 'Selecting Spots: pressing a point inside a polygon selects the point instead of asking which Spot you meant; the picker only opens when Spots truly overlap',
            commit: 'cbd9712bc',
            play: 'Smarter Spot selection on the map',
          },
          {
            text: 'Failed image uploads: an upload with failed images ends on "Uploaded With Errors!" saying how many failed, instead of "All Uploaded!"',
            commit: '9779857ed',
          },
          {
            text: 'Missing images: an image that\'s missing can be deleted from the memo or sample that holds it',
            commit: '5eccfe586',
          },
        ],
      },
    ],
  },
];

export default RELEASE_NOTES;
