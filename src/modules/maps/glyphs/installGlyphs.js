import * as Sentry from '@sentry/react-native';
import RNFS from 'react-native-fs';

import {GLYPH_FONTSTACK} from './glyphs.constants';
import {OPEN_SANS_REGULAR_GLYPHS} from '../../../assets/glyphs/openSansRegularGlyphs';
import {APP_DIRECTORIES} from '../../../services/files/directories.constants';

// Write the bundled Open Sans Regular glyph PBFs to disk so the map can render text labels from
// file:// with no network. Awaited from PersistGate's onBeforeLift so the files exist before the
// map mounts and requests them (issue #919); skips files already there, so warm starts are cheap.
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
    // Swallow so a write failure can never hang app launch (onBeforeLift), but report it: a
    // missing glyph file makes the map fail to load its style, which drops every Spot layer.
    console.error('Error installing bundled glyphs', err);
    Sentry.captureException(err);
  }
};

export default installGlyphs;
