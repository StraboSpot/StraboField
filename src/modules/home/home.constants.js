// Registry of "don't show this again" warnings. The value is the persisted key
// stored in state.home.hiddenWarnings — add a new entry here to introduce another suppressible warning.
export const DISMISSIBLE_WARNINGS = {
  CAMERA_ORIENTATION: 'cameraOrientation',
};

export const DISMISSIBLE_WARNING_MESSAGES = {
  [DISMISSIBLE_WARNINGS.CAMERA_ORIENTATION]: 'Camera orientation is recorded when Use Photo/OK is pressed, '
    + 'not at shutter click. Hold the device steady and maintain the orientation until pressing the confirmation button.',
};

export const MAP_ACTIONS = [
  {key: 'zoom', title: 'Zoom to Extent of Spots'},
  {key: 'saveMap', title: 'Save Map for Offline Use'},
  {key: 'stereonet', title: 'Lasso Spots for Stereonet'},
  {key: 'selectSpots', title: 'Inspect Spots Raw Data'},
  // {key: 'zoomToOfflineMap', title: 'Zoom to Offline Map'},
  {key: 'addTag', title: 'Add Tag(s) to Spot(s)'},
  {key: 'addToReport', title: 'Add Spot(s) to Memo'},
  {key: 'mapMeasurement', title: 'Measure Distance'},
  {key: 'stratSection', title: 'Strat Section Settings'},
  {key: 'toggleScaleBarUnits', title: 'Toggle Scale Bar Units'},
];

export const NAVIGATION_OPTIONS = {
  gestureEnabled: false,
  headerShown: false,
  swipeEnabled: false,
};
