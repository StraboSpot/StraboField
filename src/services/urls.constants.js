import config from '../utils/config';

const account = '/account';
const orcid = 'https://orcid.org/oauth';
const orcidClientId = config.get('orcid_client_id');
const sesarAPI = __DEV__ ? 'https://app-sandbox.geosamples.org/webservices' : 'https://app.geosamples.org/webservices';
const straboSpotAPI = 'https://strabospot.org';
const tilehost = 'https://tiles.strabospot.org';

// StraboField
const straboDB = straboSpotAPI + '/db';

// Images
const straboImage = straboSpotAPI + '/db/image/';
const straboProfileImage = straboSpotAPI + '/profileimage/';
const straboPublicImage = straboSpotAPI + '/pi/';
const straboPublicImageResized = straboSpotAPI + '/pi_basemap/';
const straboPublicImageThumbnail = straboSpotAPI + '/pi_thumbnail/';

// Maps
const myMapsGeotiff = straboSpotAPI + '/geotiff';
const myMapsBbox = myMapsGeotiff + '/bbox/';
const myMapsCheck = straboSpotAPI + '/strabo_mymaps_check/';
const myMapsTiles = myMapsGeotiff + '/tiles/';
const tileCount = tilehost + '/zipcount';

export const STRABO_APIS = {
  ACCOUNT: account,
  DB: straboDB,
  IMAGE: straboImage,
  MY_MAPS_BBOX: myMapsBbox,
  MY_MAPS_CHECK: myMapsCheck,
  MY_MAPS_TILES: myMapsTiles,
  PROFILE_IMAGE: straboProfileImage,
  PUBLIC_IMAGE: straboPublicImage,
  PUBLIC_IMAGE_RESIZED: straboPublicImageResized,
  PUBLIC_IMAGE_THUMBNAIL: straboPublicImageThumbnail,
  STRABO: straboSpotAPI,
  TILE_COUNT: tileCount,
  TILE_HOST: tilehost,
};

// StraboMicro
const microDB = '/microdb';

export const MICRO_PATHS = {
  MY_PROJECTS: microDB + '/myProjects',
  PDF_PROJECT: microDB + '/projectPDF',
  WEB_PROJECT: microDB + '/webProject',
};

export const SESAR_PATHS = {
  GET_TOKEN: '/get_token.php',
  REFRESH_TOKEN: '/refresh_token.php',
  GET_USER_CODE: '/credentials_service_v2.php',
  SESAR_API: sesarAPI,
  UPLOAD: '/upload.php',
  UPDATE: '/update.php',
};

export const ORCID_PATHS = {
  AUTH: '/authorize',
  ORCID: orcid,
  REDIRECT_URL: 'redirect_uri=https://www.strabospot.org/orcid_callback%3Fcreds%3D$',
  SCOPE: `?client_id=${orcidClientId}&response_type=code&scope=openid&`,
};

export const SUPPORT_PATHS = {
  GITHUB: 'https://github.com/StraboSpot/StraboField/issues/new/choose',
  EMAIL: 'mailto: strabospot@gmail.com?subject=StraboSpot2%20Issue',
};
