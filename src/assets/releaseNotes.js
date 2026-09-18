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
    version: '2.32.1',
    groups: [
      {
        title: 'Stability',
        items: [
          {text: 'Crash fix: loading or switching projects no longer crashes the app on iOS', commit: '554e1c22d'},
        ],
      },
      {
        title: 'Forms & validation',
        items: [
          {
            text: 'Live form validation: errors show as you type and Save stays disabled until they\'re fixed',
            commit: '4c79a313f',
          },
          {text: 'Find the problem field: the tab holding an unanswered field is marked so you know where to look', commit: 'cdcf10eb1'},
          {text: 'Auto dip direction: entering a strike fills in the matching dip direction wherever you type one', commit: '3daf75261'},
          {text: 'Negative numbers on iOS: type negative values, with a keyboard matched to the field', commit: '37f4bd19b'},
        ],
      },
      {
        title: 'Compass',
        items: [
          {
            text: 'Automatic declination: magnetic declination is recorded and kept up to date in your project data',
            commit: 'af79623cf',
          },
          {text: 'Compass over template: a fresh compass reading now takes priority over an active template', commit: 'e8935e8ae'},
        ],
      },
      {
        title: 'Measurements',
        items: [
          {text: 'Hide from map: hide individual measurements from the map', commit: '52da123ae'},
          {
            text: 'Bulk strike/dip: calculate missing strikes and dip directions for every record that holds a plane',
            commit: 'f851e2dbd',
          },
          {text: 'Steadier validation: planar+linear and 3D-structure measurements are checked and hinted more reliably', commit: '52a0b2c2d'},
        ],
      },
      {
        title: 'Tags',
        items: [
          {text: 'Memos on tags: add, remove, count, and list a tag\'s memos from its detail page', commit: '0075f7468'},
          {text: 'Cleaner tag counts: a tag\'s counts show as icon chips instead of a legend', commit: '336086e36'},
          {text: 'Sample tagging: only samples that have their own Spot can be tagged', commit: '74bd5d3af'},
        ],
      },
      {
        title: 'Memos',
        items: [
          {text: 'Memo authorship: memos record who wrote them and when', commit: '7c50d6792'},
          {text: 'Associated samples: link samples to a memo, including legacy samples, from the Memo modal', commit: '621c63738'},
          {text: 'Memos in Overview: a Spot\'s memos now show in its notebook Overview', commit: 'f2c4ec72b'},
        ],
      },
      {
        title: 'Notebook & pages',
        items: [
          {text: 'Feature labels: every feature list shows a label, filled in on save', commit: '0f264290d'},
          {text: 'Full Spots list: see the full Spots list when no Spot is selected', commit: '290258006'},
          {text: 'Collapsible More Pages: the More Pages sections collapse like the main menu\'s', commit: '63286a2b7'},
        ],
      },
      {
        title: 'Lists & datasets',
        items: [
          {
            text: 'Remembered sort: each list keeps its sort order and reverse sort, applied before the first paint',
            commit: '43fe4b115',
          },
          {text: 'Active dataset names: lists name the active datasets at the top, with a shortcut to open Datasets', commit: '4da0e2c21'},
          {text: 'Map filter for Spots: filter Spots by whether they\'re on the geographic map or not mapped', commit: '7cddc4a4d'},
        ],
      },
      {
        title: 'Read-only datasets',
        items: [
          {
            text: 'Read-only everywhere: read-only status now carries through image basemaps, strat sections, and forms',
            commit: '1d7af9f55',
          },
          {text: 'Protected moves: a Spot can\'t be moved into or out of a read-only dataset', commit: 'dacb7848c'},
        ],
      },
      {
        title: 'Strat sections',
        items: [
          {text: 'Image overlays: set up, save, and draw image overlays under a strat section in the right order', commit: '521f1f1ec'},
          {text: 'Open with intervals: opening a section activates the datasets holding its intervals', commit: '6252cf94b'},
        ],
      },
      {
        title: 'Samples & IGSN',
        items: [
          {text: 'Steadier SESAR: improved login and token handling for IGSN registration', commit: '340bbda00'},
          {text: 'Safer saves: Save is disabled when SESAR registration can\'t go through', commit: 'eed4069c7'},
          {text: 'Correct sample location: a sample from an image-basemap Spot gets a real-world location', commit: 'c8bf57cce'},
        ],
      },
      {
        title: 'Shortcuts',
        items: [
          {text: 'Straight to the Notebook: each shortcut opens its new Spot in the Notebook', commit: 'f23e9d0b8'},
          {text: 'No empty Spots: canceling a photo or sketch no longer leaves an empty Spot behind', commit: 'c260154ca'},
        ],
      },
      {
        title: 'Maps',
        items: [
          {text: 'Accurate Spot placement: a Spot lands on the map it was set in, sized to the view', commit: 'a3956a1b2'},
          {text: 'Remembered map view: the map view is saved once the camera settles', commit: 'ae29924cc'},
          {text: 'Single name label: a Spot with multiple measurements draws its name label once', commit: '28772ecd6'},
        ],
      },
      {
        title: 'Small touches',
        items: [
          {text: 'Copied Spots: a copied Spot gets its own feature ids', commit: '4bc897794'},
          {text: 'Mineral lookup: mineral data you already entered is kept when a mineral is looked up', commit: '25b763f5c'},
          {text: 'Project visibility: an owner\'s project is listed again once its collaboration is halted', commit: '3cde7a4b4'},
        ],
      },
    ],
  },
  {
    version: '2.31.3',
    groups: [
      {
        title: 'Stability',
        items: [
          {text: 'Fewer crashes: fixed iOS crashes that could occur when switching between modal screens', commit: '94e61003c'},
        ],
      },
    ],
  },
  {
    version: '2.31.2',
    groups: [
      {
        title: 'Compass',
        items: [
          {text: 'Works without GPS: uses magnetic declination on devices with no GPS fix', commit: 'd645effd7'},
          {text: 'Hold-aware readings: trend/plunge adjust for landscape and tablet orientation', commit: 'bf0a6c903'},
          {
            text: 'Clearer calibration: improved calibration alerts and more consistent behavior across platforms',
            commit: '4b6e2fbca',
          },
        ],
      },
      {
        title: 'Samples & IGSN',
        items: [
          {
            text: 'Steadier SESAR: better session handling, offline warnings, and clearer error feedback when registering IGSNs',
            commit: 'cdbb1ee75',
          },
        ],
      },
      {
        title: 'Small touches',
        items: [
          {text: 'Custom map details scroll properly on smaller screens', commit: '23f3f0858'},
        ],
      },
    ],
  },
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
            text: 'IGSN registration: updated registration UI, with a Get IGSN button and an upload progress bar',
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
        title: 'Measurements',
        items: [
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
