import {Platform} from 'react-native';

import {APP_DIRECTORIES} from '../../services/files/directories.constants';
import {STRABO_APIS} from '../../services/network/urls.constants';

export const getImageThumbnailURI = id => STRABO_APIS.PUBLIC_IMAGE_THUMBNAIL + id;

// Display sites pass modified_timestamp as the version: RN, Mapbox and the browser key their image
// caches on the URI, so a sketch that replaces a file without changing its id needs a fresh one.
// File operations omit it — the version is a query, not part of the file name.
export const getLocalImageURI = (id, version) =>
  (Platform.OS === 'web' ? STRABO_APIS.PUBLIC_IMAGE + id : 'file://' + APP_DIRECTORIES.IMAGES + id + '.jpg')
  + (version ? '?v=' + version : '');

export const getResizedImageURI = (id, width, height) =>
  STRABO_APIS.PUBLIC_IMAGE_RESIZED + Math.max(width, height) + '/' + id;
