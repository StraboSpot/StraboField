import {Platform} from 'react-native';

import RNFS from 'react-native-fs';

const devicePath = RNFS.DocumentDirectoryPath;
const exportPath = Platform.OS === 'ios' ? devicePath : RNFS.DownloadDirectoryPath + '/StraboSpot2';
const androidDownloadsPath = RNFS.DownloadDirectoryPath + '/StraboSpot2/Backups/'; //Android Only
const androidExportPath = devicePath + '/AndroidExportFiles/';
// const appDirectoryForDistributedBackups = Platform.OS === 'ios' ? devicePath + /ProjectBackups/ : androidBackupPath + '/StraboSpot2/ProjectBackups/';
const appDirectoryForBackups = devicePath + '/ProjectBackups/';
const appDirectoryForDistributedBackups = devicePath + '/Distribution/';
const appDirectory = devicePath + '/StraboSpot';
const sharedDocumentsPathIOS = 'shareddocuments://'; // To access Files.app on iOS
const imagesDirectory = appDirectory + '/Images/';
const tilesDirectory = devicePath + '/StraboSpotTiles';
const tileCacheDirectory = tilesDirectory + '/TileCache/';
const tileTempDirectory = tilesDirectory + '/TileTemp/';
const zipsDirectory = tilesDirectory + '/TileZips/';

// StraboMicro Projects Paths
const microDirectory = appDirectory + '/Micro/';
const microExportsPath = exportPath + '/StraboMicro Projects/';
const microZipsDirectory = appDirectory + '/Micro/Zips/';

export const APP_EXPORT_DIRECTORY = Platform.OS === 'ios' ? appDirectoryForDistributedBackups : androidExportPath;
export const TEMP_IMAGES_DOWNSIZED_DIRECTORY = appDirectory + '/TempImages';

export const APP_DIRECTORIES = {
  ROOT_PATH: devicePath,
  APP_DIR: appDirectory,
  BACKUP_DIR: appDirectoryForBackups,
  DOWNLOAD_DIR_ANDROID: androidDownloadsPath,
  EXPORT_FILES_ANDROID: androidExportPath,
  EXPORT_FILES_IOS: appDirectoryForDistributedBackups,
  SHARED_DOCUMENTS_PATH_IOS: sharedDocumentsPathIOS,
  IMAGES: imagesDirectory,
  MICRO: microDirectory,
  MICRO_EXPORTS: microExportsPath,
  MICRO_ZIPS: microZipsDirectory,
  PROFILE_IMAGE: imagesDirectory + 'profileImage.jpg',
  TILE_CACHE: tileCacheDirectory,
  TILES_DIRECTORY: tilesDirectory,
  TILE_TEMP: tileTempDirectory,
  TILE_ZIP: zipsDirectory,
};
