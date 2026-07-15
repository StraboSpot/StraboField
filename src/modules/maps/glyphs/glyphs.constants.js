import {Platform} from 'react-native';

import {APP_DIRECTORIES} from '../../../services/files/directories.constants';

// Native pins a single-font stack so Mapbox requests exactly "Open Sans Regular" — not the
// default "Open Sans Regular,Arial Unicode MS Regular" stack, which has no bundled file. Every
// native label layer must set textFont to this. Web is online, so it keeps the default stack.
export const GLYPH_FONTSTACK = 'Open Sans Regular';
export const GLYPH_FONT = Platform.OS === 'web' ? [GLYPH_FONTSTACK, 'Arial Unicode MS Regular']
  : [GLYPH_FONTSTACK];

// Native serves glyphs from the bundled PBFs on disk (written by installGlyphs); web fetches
// them from Mapbox. {fontstack} resolves to GLYPH_FONTSTACK, so files live at <GLYPHS>/<font>/.
export const GLYPHS_URL = Platform.OS === 'web' ? 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf'
  : 'file://' + APP_DIRECTORIES.GLYPHS + '{fontstack}/{range}.pbf';
