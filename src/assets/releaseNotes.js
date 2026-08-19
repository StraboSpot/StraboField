// User-facing release notes shown in the About page "What's New" modal.
//
// An ordered list (newest version first) of what shipped in each version. The About page groups these
// by minor series (e.g. "2.30.x New Features") and shows every entry at or below the running version,
// so the modal is a short history of recent releases. Keep the wording written for geologists, not
// commit-by-commit — the full developer changelog lives on the GitHub Releases page.
//
// Each highlight is {text, commit}: `text` is the user-facing blurb (the part before the first colon
// is bolded in the modal), and `commit` is the short hash of the representative commit so users can
// open it on GitHub. A feature that spans several commits just points at its main one.
//
// Scope per version: the highlights summarize the commits that END at that version's bump — i.e. the
// range [previous version's bump .. this version's bump]. So 2.30.5 = commits from the 2.30.4 bump up
// to the 2.30.5 bump. 2.30.0 = everything before the 2.30.0 bump (its flagship Samples/IGSN/auto-save
// work), and 2.30.6 = the commits after the 2.30.5 bump that will close out at the 2.30.6 bump.
//
// Add a new entry to the TOP each release. `version` must match the string in package.json.

// All git remotes redirect to StraboSpot/StraboField; commit hashes resolve there.
export const COMMIT_BASE_URL = 'https://github.com/StraboSpot/StraboField/commit/';

const RELEASE_NOTES = [
  {
    version: '2.30.6',
    highlights: [
      {text: 'Freehand drawing on web: draw freehand lines and polygons in the web app', commit: 'd07c52a44'},
      {text: 'Dike symbol: added a map symbol for the dike planar feature type', commit: '24feb05e5'},
      {text: 'Stereonet lasso on web: lasso-select measurements on the stereonet in the web app', commit: '55104cf1c'},
      {text: 'Export & import on web: back up and import tags, geologic units, and templates', commit: '508f52e77'},
      {text: 'Forgot Password: reset your password right from the sign-in screen', commit: '35a196514'},
      {text: 'More Pages menu: reorganized into five clearer sections', commit: 'df87b5b69'},
      {text: 'Inspect Raw Data: expanded by default, and now available on web', commit: '7a3c8f35e'},
      {text: 'Session handling: prompts you to sign back in when your session expires instead of failing silently', commit: '83bd762d8'},
    ],
  },
  {
    version: '2.30.5',
    highlights: [
      {text: 'Compass: redesigned dial with animated headings and tick marks', commit: 'a90dd586b'},
      {text: 'Outcrop Summaries: a new notebook page with a single summary per Spot, plus grouped Critical Outcrop fields and hints', commit: 'bc1109ffc'},
      {text: 'UTM coordinates: toggle a UTM coordinate display on the map', commit: 'f402b9b95'},
      {text: 'Save sketches your way: save a sketch over an image as a copy or an update, with a heads-up before you overwrite', commit: '7832c1b9f'},
      {text: 'Clearer field hints: hints now open in a modal instead of an alert', commit: '29bbd614d'},
      {text: 'Note field type: forms can now include a free-text note field', commit: '5d8b5f828'},
      {text: 'Battery status: battery icons now show charging vs. discharging', commit: '7f7699177'},
      {text: 'Offline profile sync: your profile syncs even after you\'ve been offline', commit: '9f1e056d4'},
      {text: 'IGSN: view or get an IGSN for a sample from a modal', commit: 'ba5315d70'},
    ],
  },
  {
    version: '2.30.4',
    highlights: [
      {text: 'Zoom & pan while sketching: pinch to zoom and drag to pan when drawing on an image', commit: 'cd6c5f37f'},
      {text: 'Measurement mode that sticks: your manual vs. compass preference now syncs and is remembered', commit: 'bc7146942'},
      {text: 'Conventions remembered: unsaved convention changes are kept and toggles stay in sync', commit: 'f5063a7ef'},
      {text: 'Offline custom basemaps: now appear device-wide and even while you\'re online', commit: '5e83cd22c'},
    ],
  },
  {
    // No user-facing highlights this version — internal/maintenance work only. An empty highlights
    // array renders a "No user-facing highlights" line in the modal.
    version: '2.30.3',
    highlights: [],
  },
  {
    version: '2.30.2',
    highlights: [
      {text: 'Freehand vertex spacing: control how closely points are placed when you draw freehand lines and polygons', commit: '243d8d7b1'},
      {text: 'Undo Spot delete: deleted a Spot by mistake? Tap the undo toast to bring it back (native only)', commit: '9afdad672'},
      {text: 'Extend a line: drag out a new endpoint to make an existing line longer', commit: '1614fecb8'},
      {text: 'Overlapping Spot picker: when several Spots sit under your tap, choose exactly which one to select', commit: '35378aa7e'},
      {text: 'More precise selection: tighter tap targeting, and edit/draw vertices stay visible on light basemaps', commit: 'd4ab7235a'},
      {text: 'Checkbox selection: multi-select now uses checkboxes instead of a full-row highlight', commit: '09681d5f8'},
    ],
  },
  {
    version: '2.30.1',
    highlights: [
      {text: 'Powerful list search & filters: a shared search bar with grouped multi-select filters for Spots and Tags', commit: '0cd4e7242'},
      {text: 'Live map extent lists: your lists update automatically as you move the map — no button to press', commit: 'b38b122a6'},
      {text: 'Colored strat intervals: strat section intervals take on their tag or geologic-unit colors', commit: '819850e22'},
      {text: 'Quick-add from lists: a Create New button at the top of the Tags, Geologic Units, and Templates lists', commit: '261235d78'},
    ],
  },
  {
    version: '2.30.0',
    highlights: [
      {text: 'Richer Samples: Samples can now hold images, measurements, and more — just like Spots — with a gold border and banner, visible in nesting, and taggable', commit: 'e1816cd9a'},
      {text: 'More in the Add Sample screen: attach images and assign geologic units right when you create a sample', commit: '3ce140926'},
      {text: 'Get an IGSN: register and manage IGSNs end-to-end with a Get IGSN button and an upload progress bar', commit: '25dadd71b'},
      {text: 'Keep IGSNs in sync: get prompted to update SESAR when relevant fields change, see a View IGSN Data link, and be warned when you\'re offline', commit: 'd94a9181c'},
      {text: 'Auto-save: your work now saves automatically alongside the existing manual backup, with save/upload frequencies and countdown timers you can adjust', commit: '613d9220f'},
      {text: 'See your backup status: a status screen and status-bar icons show what\'s pending, with Save Now / Upload Now buttons', commit: '93980b3d6'},
      {text: 'New map symbol label option: label map symbols with Dip/Plunge/Name', commit: 'd0e63d42e'},
      {text: 'More surface-feature detail: added quality and notes fields to the surface-feature form', commit: '9149f17d0'},
      {text: 'Clearer section headers: section dividers and overview headers now show icons', commit: 'c40e333cf'},
    ],
  },
];

export default RELEASE_NOTES;
