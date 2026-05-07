import {Platform} from 'react-native';

import {APP_DIRECTORIES} from '../../services/files/directories.constants';
import {STRABO_APIS} from '../../services/network/urls.constants';

export const getImageThumbnailURI = id => STRABO_APIS.PUBLIC_IMAGE_THUMBNAIL + id;

export const getLocalImageURI = id => Platform.OS === 'web' ? STRABO_APIS.PUBLIC_IMAGE + id
  : 'file://' + APP_DIRECTORIES.IMAGES + id + '.jpg';

export const getResizedImageURI = (id, width, height) =>
  STRABO_APIS.PUBLIC_IMAGE_RESIZED + Math.max(width, height) + '/' + id;
