// Registry of "don't show this again" warnings. The value is the persisted key
// stored in state.home.hiddenWarnings — add a new entry here to introduce another suppressible warning.
export const DISMISSIBLE_WARNINGS = {
  CAMERA_ORIENTATION: 'cameraOrientation',
};

export const DISMISSIBLE_WARNING_MESSAGES = {
  [DISMISSIBLE_WARNINGS.CAMERA_ORIENTATION]: 'Camera orientation is recorded when Use Photo/OK is pressed, '
    + 'not at shutter click. Hold the device steady and maintain the orientation until pressing the confirmation button.',
};

// The actions useHome's handleHomeAction runs. An action no case matches silently does nothing, so its cases and the
// buttons that call it both use these names. The draw tools are home actions too, named by their MAP_MODES.DRAW mode.
export const HOME_ACTIONS = {
  ADD_INTERVAL: 'addInterval',
  ADD_TAG: 'addTag',
  ADD_TO_REPORT: 'addToReport',
  CANCEL_EDITS: 'cancelEdits',
  CANCEL_INTERVAL_DRAG: 'cancelIntervalDrag',
  CLOSE_IMAGE_BASEMAP: 'closeImageBasemap',
  CLOSE_STRAT_SECTION: 'closeStratSection',
  MAP_MEASUREMENT: 'mapMeasurement',
  SAVE_EDITS: 'saveEdits',
  SAVE_MAP: 'saveMap',
  SAVE_REORDERING: 'saveReordering',
  SELECT_SPOTS: 'selectSpots',
  START_EDITING: 'startEditing',
  START_INTERVAL_DRAG: 'startIntervalDrag',
  STEREONET: 'stereonet',
  STRAT_SECTION: 'stratSection',
  TOGGLE_SCALE_BAR_UNITS: 'toggleScaleBarUnits',
  TOGGLE_USER_LOCATION: 'toggleUserLocation',
  ZOOM: 'zoom',
};

export const MAP_ACTIONS_MENU_ITEMS = [
  {key: HOME_ACTIONS.ZOOM, title: 'Zoom to Extent of Spots'},
  {key: HOME_ACTIONS.SAVE_MAP, title: 'Save Map for Offline Use'},
  {key: HOME_ACTIONS.STEREONET, title: 'Lasso Spots for Stereonet'},
  {key: HOME_ACTIONS.SELECT_SPOTS, title: 'Inspect Spots Raw Data'},
  {key: HOME_ACTIONS.ADD_TAG, title: 'Add Tag(s) to Spot(s)'},
  {key: HOME_ACTIONS.ADD_TO_REPORT, title: 'Add Spot(s) to Memo'},
  {key: HOME_ACTIONS.MAP_MEASUREMENT, title: 'Measure Distance'},
  {key: HOME_ACTIONS.STRAT_SECTION, title: 'Strat Section Settings'},
  {key: HOME_ACTIONS.TOGGLE_SCALE_BAR_UNITS, title: 'Toggle Scale Bar Units'},
];

export const NAVIGATION_OPTIONS = {
  gestureEnabled: false,
  headerShown: false,
  swipeEnabled: false,
};
