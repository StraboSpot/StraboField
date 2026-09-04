// User-facing release notes shown in the About page "What's New" modal.
//
// An ordered list (newest release first) of what shipped in each PUBLIC release. Interim rc/patch
// builds (e.g. the 2.30.x series) are not listed individually — their changes are rolled up into the
// public release that ships them (e.g. 2.31.0). The About page shows every release at or below the
// running version (plus, in dev builds, not-yet-shipped ones flagged "unreleased").
//
// Each release's highlights are organized into `groups` of related changes: {title, items}, where
// each item is {text, commit}. `text` is the user-facing blurb (the part before the first colon is
// bolded in the modal), and `commit` is the short hash of the representative commit so users can open
// it on GitHub. A feature that spans several commits just points at its main one.
//
// Add a new entry to the TOP for each public release. `version` must match the string in package.json
// once that release ships. An empty `groups` array renders "No user-facing highlights".

// All git remotes redirect to StraboSpot/StraboField; commit hashes resolve there.
export const COMMIT_BASE_URL = 'https://github.com/StraboSpot/StraboField/commit/';

const RELEASE_NOTES = [
  {
    version: '2.31.1',
    groups: [
      {
        title: 'Compass',
        items: [
          {
            text: 'Smoother, more accurate compass: faster needle updates and improved declination handling',
            commit: '85d7dddb0',
          },
        ],
      },
      {
        title: 'Samples & IGSN',
        items: [
          {
            text: 'IGSN required fields: registration now warns inline about missing required fields, and falls back to the Spot\'s date when no collection date is set',
            commit: '88b6528d1',
          },
          {
            text: 'Sample dates: converting a legacy sample keeps the parent Spot\'s created date',
            commit: '563d0e73c',
          },
        ],
      },
      {
        title: 'Maps',
        items: [
          {
            text: 'Import progress: see progress while importing, and large tile imports no longer stall',
            commit: 'a97d9e98f',
          },
        ],
      },
      {
        title: 'Backup & uploads',
        items: [
          {text: 'Simpler uploads: a unified upload screen with more consistent behavior', commit: '46a29cc00'},
          {text: 'Accurate backup times: backup lists now show the correct timestamps', commit: '3830bb70a'},
        ],
      },
    ],
  },
  {
    version: '2.31.0',
    groups: [
      {
        title: 'Samples & IGSN',
        items: [
          {
            text: 'Richer Samples: Samples can now hold images, measurements, and more — just like Spots — with a gold border and banner, visible in nesting, and taggable',
            commit: 'e1816cd9a',
          },
          {
            text: 'Add Sample screen: attach images and assign geologic units right when you create a sample',
            commit: '3ce140926',
          },
          {
            text: 'Get an IGSN: register and manage IGSNs end-to-end, with a Get IGSN button and an upload progress bar',
            commit: '25dadd71b',
          },
          {
            text: 'Keep IGSNs in sync: prompts to update SESAR when relevant fields change, with a View IGSN Data link and offline warnings',
            commit: 'd94a9181c',
          },
        ],
      },
      {
        title: 'Now on the web',
        items: [
          {text: 'Freehand drawing: draw freehand lines and polygons in the web app', commit: 'd07c52a44'},
          {text: 'Stereonet lasso: lasso-select measurements for Stereonet', commit: '55104cf1c'},
          {text: 'Export & import: tags, geologic units, and templates', commit: '508f52e77'},
        ],
      },
      {
        title: 'Drawing & editing',
        items: [
          {
            text: 'Freehand vertex spacing: control how closely points are placed when you draw freehand lines and polygons',
            commit: '243d8d7b1',
          },
          {text: 'Extend a line: drag out a new endpoint to make an existing line longer', commit: '1614fecb8'},
          {
            text: 'Overlapping Spot picker: when several Spots sit under your tap, choose exactly which one to select',
            commit: '35378aa7e',
          },
          {
            text: 'Undo Spot delete: deleted a Spot by mistake? Tap the undo toast to bring it back (not on web)',
            commit: '9afdad672',
          },
        ],
      },
      {
        title: 'Map display & symbols',
        items: [
          {text: 'Dike symbol: a new map symbol for the dike planar feature type', commit: '24feb05e5'},
          {text: 'Symbol labels: label map symbols with Dip/Plunge/Name', commit: 'd0e63d42e'},
          {text: 'UTM coordinates: toggle a UTM coordinate display on the map', commit: 'f402b9b95'},
          {
            text: 'Colored strat intervals: strat section intervals take on their tag or geologic-unit colors',
            commit: '819850e22',
          },
        ],
      },
      {
        title: 'Notebook & forms',
        items: [
          {
            text: 'Outcrop Summaries: a new notebook page with 1 summary per Spot',
            commit: 'bc1109ffc',
          },
          {text: 'More Pages menu: reorganized into five clearer sections', commit: 'df87b5b69'},
          {
            text: 'Surface-feature detail: added quality and notes fields',
            commit: '9149f17d0',
          },
        ],
      },
      {
        title: 'Photos & sketching',
        items: [
          {
            text: 'Save sketches your way: save a sketch over an image as a copy or an update, with a heads-up before you overwrite',
            commit: '7832c1b9f',
          },
          {
            text: 'Zoom & pan while sketching: pinch to zoom and drag to pan when drawing on an image',
            commit: 'cd6c5f37f',
          },
        ],
      },
      {
        title: 'Lists & search',
        items: [
          {
            text: 'Powerful search & filters: a shared search bar with grouped multi-select filters for Spots and Tags',
            commit: '0cd4e7242',
          },
          {
            text: 'Live map extent lists: your lists update automatically as you move the map — no button to press',
            commit: 'b38b122a6',
          },
          {text: 'Inspect Raw Data: expanded by default, and now available on web', commit: '7a3c8f35e'},
        ],
      },
      {
        title: 'Compass & measurements',
        items: [
          {text: 'Compass: redesigned dial with animated headings and tick marks', commit: 'a90dd586b'},
          {
            text: 'Measurement mode that sticks: your manual vs. compass preference now syncs and is remembered',
            commit: 'bc7146942',
          },
        ],
      },
      {
        title: 'Backup, sync & offline',
        items: [
          {
            text: 'Auto-save: saves your work automatically alongside manual backup, with adjustable frequencies and countdown timers',
            commit: '613d9220f',
          },
          {
            text: 'Backup status: a status screen and status-bar icons show what\'s pending, with Save Now button',
            commit: '93980b3d6',
          },
          {text: 'Offline profile sync: your profile syncs even after you\'ve been offline', commit: '9f1e056d4'},
        ],
      },
      {
        title: 'Accounts & sign-in',
        items: [
          {text: 'Forgot Password: reset your password right from the sign-in screen', commit: '35a196514'},
          {
            text: 'Session handling: prompts you to sign back in when your session expires instead of failing silently',
            commit: '83bd762d8',
          },
        ],
      },
      {
        title: 'Small touches',
        items: [
          {text: 'Battery status: battery icons now show charging vs. discharging', commit: '7f7699177'},
          {
            text: 'Conventions remembered: unsaved convention changes are kept and toggles stay in sync',
            commit: 'f5063a7ef',
          },
          {
            text: 'Checkbox selection: multi-select now uses checkboxes instead of a full-row highlight',
            commit: '09681d5f8',
          },
        ],
      },
    ],
  },
];

export default RELEASE_NOTES;
