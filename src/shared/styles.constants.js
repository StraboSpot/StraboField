import {Dimensions, Platform} from 'react-native';

const platform = Platform.OS === 'ios' ? 'screen' : 'window';
const {width, height} = Dimensions.get(platform);

//See https://facebook.github.io/react-native/docs/colors
export const LIGHTGREY = '#f7f7f7'; //(lightgrey)
export const MEDIUMGREY = 'darkgray'; //(#d3d3d3)
export const MEDIUMGREY_FADED = '#d3d3d3E6'; // 90% opacity
export const DARKGREY = 'dimgray';
export const BLUE = 'dodgerblue'; // (#1e90ff)
export const BLUE_FADED_20 = '#1e90ff33';  // Blue at 40% opacity
export const BLUE_FADED_40 = '#1e90ff66';  // Blue at 40% opacity
export const BLUE_FADED_60 = '#1e90ff99';  // Blue at 60% opacity
export const GREEN = 'green';
export const RED = 'red';
export const WHITE = '#ffffff';
export const BLACK = 'black';
export const GOLD = '#FFD700';
//export const REACT_NATIVE_ELEMENTS_BLUE = '#2089dc';

export const PRIMARY_BACKGROUND_COLOR = LIGHTGREY;
export const SECONDARY_BACKGROUND_COLOR = WHITE;

export const PRIMARY_TEXT_COLOR = BLACK;
export const SECONDARY_TEXT_COLOR = WHITE;

export const PRIMARY_ACCENT_COLOR = BLUE;
export const PRIMARY_ACCENT_COLOR_FADED_20 = BLUE_FADED_20;
export const PRIMARY_ACCENT_COLOR_FADED_40 = BLUE_FADED_40;
export const PRIMARY_ACCENT_COLOR_FADED_60 = BLUE_FADED_60;

export const POSITIVE_COLOR = GREEN;
export const NEGATIVE_COLOR = RED;
export const NEUTRAL_COLOR = PRIMARY_ACCENT_COLOR;
export const WARNING_COLOR = RED;


export const LIST_BORDER_COLOR = MEDIUMGREY;

export const TEXT_WEIGHT_500 = '500';
export const TEXT_WEIGHT_700 = '700';
export const PRIMARY_TEXT_SIZE = Platform.OS === 'web' ? 12 : 16;
export const PRIMARY_HEADER_TEXT_SIZE = Platform.OS === 'web' ? 14 : 20;
export const SMALL_TEXT_SIZE = Platform.OS === 'web' ? 10 : 14;
export const MEDIUM_TEXT_SIZE = Platform.OS === 'web' ? 12 : 16;
export const LARGE_TEXT_SIZE = Platform.OS === 'web' ? 18 : 22;
export const SPOT_NAME_SIZE = Platform.OS === 'web' ? 20 : 30;

// MODALS AND OVERLAYS
export const MODAL_TEXT_SIZE = Platform.OS === 'web' ? 10 : 14;
export const MODAL_BORDER_RADIUS = 10;
export const MODAL_WIDTH = 300;
export const SMALL_SCREEN_STATUS_BAR_OFFSET = 50;

export const UPDATE_LABEL_WIDTH = 150;
export const UPDATE_LABEL_HEIGHT = 150;
export const MODAL_BACKDROP = 'rgba(0, 0, 0, 0.5)';

// Home Menu and Notebook widths
export const MAIN_MENU_WIDTH = 300;
export const NOTEBOOK_WIDTH = 400;

export const SMALL_SCREEN = width < 600;
export const MEDIUM_SCREEN = (width >= 600 && width < 840) || (height >= 480 && height < 900);
export const LARGE_SCREEN = width > 840 || height > 900;
