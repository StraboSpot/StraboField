import {MAP_MODES} from '../maps/maps.constants';

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

// Home actions that leave an interval drag running: its own buttons, and the location dot, which a timer can also
// turn off. Any other action ends the drag first.
export const ACTIONS_ALLOWED_DURING_INTERVAL_DRAG = [
  HOME_ACTIONS.CANCEL_INTERVAL_DRAG,
  HOME_ACTIONS.SAVE_REORDERING,
  HOME_ACTIONS.START_INTERVAL_DRAG,
  HOME_ACTIONS.TOGGLE_USER_LOCATION,
];

// Home actions that create a Spot, leave the map or switch to another mode, so a map edit in progress has to end
// before they run
export const ACTIONS_THAT_END_MAP_EDITING = [
  MAP_MODES.DRAW.POINT,
  MAP_MODES.DRAW.LINE,
  MAP_MODES.DRAW.POLYGON,
  MAP_MODES.DRAW.FREEHANDPOLYGON,
  MAP_MODES.DRAW.FREEHANDLINE,
  MAP_MODES.DRAW.POINTLOCATION,
  HOME_ACTIONS.ADD_INTERVAL,
  HOME_ACTIONS.CLOSE_IMAGE_BASEMAP,
  HOME_ACTIONS.CLOSE_STRAT_SECTION,
  HOME_ACTIONS.START_INTERVAL_DRAG,
];

// Home actions that leave a notebook page by selecting or clearing a Spot or closing the notebook. The lasso tools
// clear the selected Spots as they start, starting an edit closes the notebook, and a drag selects each interval
// pressed.
export const ACTIONS_THAT_LEAVE_NOTEBOOK_PAGE = [
  MAP_MODES.DRAW.POINT,
  MAP_MODES.DRAW.LINE,
  MAP_MODES.DRAW.POLYGON,
  MAP_MODES.DRAW.FREEHANDPOLYGON,
  MAP_MODES.DRAW.FREEHANDLINE,
  MAP_MODES.DRAW.POINTLOCATION,
  HOME_ACTIONS.ADD_INTERVAL,
  HOME_ACTIONS.ADD_TAG,
  HOME_ACTIONS.ADD_TO_REPORT,
  HOME_ACTIONS.CLOSE_IMAGE_BASEMAP,
  HOME_ACTIONS.CLOSE_STRAT_SECTION,
  HOME_ACTIONS.SELECT_SPOTS,
  HOME_ACTIONS.START_EDITING,
  HOME_ACTIONS.START_INTERVAL_DRAG,
  HOME_ACTIONS.STEREONET,
  HOME_ACTIONS.STRAT_SECTION,
];

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
