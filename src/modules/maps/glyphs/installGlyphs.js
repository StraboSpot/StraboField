import RNFS from 'react-native-fs';

import {GLYPH_FONTSTACK} from './glyphs.constants';
import {OPEN_SANS_REGULAR_GLYPHS} from '../../../assets/glyphs/openSansRegularGlyphs';
import {APP_DIRECTORIES} from '../../../services/files/directories.constants';

// Write the bundled Open Sans Regular glyph PBFs to disk so the map can render text labels from
// file:// with no network. Runs at cold start, before the map mounts; skips files already there.
const installGlyphs = async () => {
  try {
    const fontDir = APP_DIRECTORIES.GLYPHS + GLYPH_FONTSTACK;
    if (!(await RNFS.exists(fontDir))) await RNFS.mkdir(fontDir);   // mkdir creates intermediate dirs
    for (const [range, base64] of Object.entries(OPEN_SANS_REGULAR_GLYPHS)) {
      const path = fontDir + '/' + range + '.pbf';
      if (!(await RNFS.exists(path))) await RNFS.writeFile(path, base64, 'base64');
    }
    console.log('Bundled glyphs installed at', fontDir);
  }
  catch (err) {
    console.error('Error installing bundled glyphs', err);
  }
};

export default installGlyphs;
