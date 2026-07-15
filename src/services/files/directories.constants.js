import {Platform} from 'react-native';

import RNFS from 'react-native-fs';

const isIOS = Platform.OS === 'ios';

/* Shared Paths */
const documentDir = RNFS.DocumentDirectoryPath;
const appDir = documentDir + '/StraboSpot';
const backupDir = documentDir + '/ProjectBackups/';
const imagesDir = appDir + '/Images/';
const microDir = appDir + '/Micro/';
const microZipsDir = appDir + '/Micro/Zips/';
const tilesDir = documentDir + '/StraboSpotTiles';
const tileCacheDir = tilesDir + '/TileCache/';
const glyphsDir = appDir + '/Glyphs/';   // Bundled map-label glyphs, installed at startup for offline text
const tileTempDir = tilesDir + '/TileTemp/';
const tileZipsDir = tilesDir + '/TileZips/';

/* iOS-Only Paths */
const iosDistributionDir = documentDir + '/Distribution/';     // Accessible via Files app
const iosSharedDocumentsPath = 'shareddocuments://';           // Deep-links into Files app

/* Android-Only Paths */
const androidTempExportDir = documentDir + '/AndroidExportFiles/';             // Private temp dir; files moved to Downloads via MediaStore
const androidDownloadsBackupDir = RNFS.DownloadDirectoryPath + '/StraboSpot2/Backups/';  // Final destination in Downloads

/* Platform-Specific  */
// iOS uses Distribution/; Android uses AndroidExportFiles/ as a staging area before MediaStore copy
export const APP_EXPORT_DIRECTORY = isIOS ? iosDistributionDir : androidTempExportDir;

const microExportsDir = (isIOS ? documentDir : RNFS.DownloadDirectoryPath + '/StraboSpot2') + '/StraboMicro Projects/';

export const TEMP_IMAGES_DOWNSIZED_DIRECTORY = appDir + '/TempImages';

export const APP_DIRECTORIES = {
  // Shared
  ROOT_PATH: documentDir,
  APP_DIR: appDir,
  BACKUP_DIR: backupDir,
  GLYPHS: glyphsDir,
  IMAGES: imagesDir,
  PROFILE_IMAGE: imagesDir + 'profileImage.jpg',
  MICRO: microDir,
  MICRO_EXPORTS: microExportsDir,
  MICRO_ZIPS: microZipsDir,
  TILE_CACHE: tileCacheDir,
  TILES_DIRECTORY: tilesDir,
  TILE_TEMP: tileTempDir,
  TILE_ZIP: tileZipsDir,

  // iOS-only
  EXPORT_FILES_IOS: iosDistributionDir,
  SHARED_DOCUMENTS_PATH_IOS: iosSharedDocumentsPath,

  // Android-only
  EXPORT_FILES_ANDROID: androidTempExportDir,
  DOWNLOAD_DIR_ANDROID: androidDownloadsBackupDir,
};
