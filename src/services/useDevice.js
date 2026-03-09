import {Linking, PermissionsAndroid, Platform} from 'react-native';

import {keepLocalCopy, types} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import {unzip} from 'react-native-zip-archive';
import {useDispatch} from 'react-redux';

import {APP_DIRECTORIES} from './directories.constants';
import useServerRequests from './useServerRequests';
import {setLoadingStatus} from '../modules/home/home.slice';
import {deletedOfflineMap} from '../modules/maps/offline-maps/offlineMaps.slice';
import {doesBackupDirectoryExist, doesDownloadsDirectoryExist} from '../modules/project/projects.slice';
import usePermissions from '../services/usePermissions';
import useSafeDocumentPicker from '../services/useSafeDocumentPicker';

const {PERMISSIONS, RESULTS} = PermissionsAndroid;
const useDevice = () => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {checkPermission} = usePermissions();
  const {handleError, safePick} = useSafeDocumentPicker();
  const {getImage, getProfileImageURL} = useServerRequests();

  /* Internal Functions */

  const createAppDirectory = async (directory) => {
    console.log('Creating directory...', directory);
    return RNFS.mkdir(directory)
      .then(() => {
        console.log('Finished creating directory:', directory);
        return true;
      })
      .catch((err) => {
        console.error('Error creating directory', directory, 'ERROR:', err);
        throw Error(err);
      });
  };

  /* Exported Functions */

  const copyFiles = async (source, target) => {
    try {
      await RNFS.copyFile(source, target);
    }
    catch (err) {
      throw Error(err);
    }
  };

  const createProjectDirectories = async () => {
    console.log('Creating Project Directories...');
    if (Platform.OS === 'android') {
      const permissionsGranted = await checkPermission(PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      if (permissionsGranted === RESULTS.GRANTED) {
        await makeDirectory(APP_DIRECTORIES.DOWNLOAD_DIR_ANDROID);
        console.log('Android Downloads/StraboSpot/Backups directory created');
        await makeDirectory(APP_DIRECTORIES.EXPORT_FILES_ANDROID);
        console.log('AndroidExportFiles directory created');
      }
      else {
        console.log('PERMISSION NOT GRANTED', permissionsGranted);
      }
    }
    if (Platform.OS === 'ios') {
      await makeDirectory(APP_DIRECTORIES.EXPORT_FILES_IOS);
      console.log('Distribution directory created for iOS');
    }
    await makeDirectory(APP_DIRECTORIES.APP_DIR);
    console.log('App Directory Created');
    await makeDirectory(APP_DIRECTORIES.IMAGES);
    console.log('Images Directory Created');
    await makeDirectory(APP_DIRECTORIES.BACKUP_DIR);
    console.log('Backup Directory Created');

    await makeDirectory(APP_DIRECTORIES.TILES_DIRECTORY);
    console.log('Tiles Directory Created');
    await makeDirectory(APP_DIRECTORIES.TILE_CACHE);
    console.log('Tile Cache Directory Created');

    // console.log('Here are all the app directories created.', RNFS.readdir(APP_DIRECTORIES));
  };

  const deleteFromDevice = async (dir, file) => {
    const filepath = file ? dir + file : dir;
    console.log('Delete Path:', filepath);
    await RNFS.unlink(filepath);
    console.log(`${filepath} has been DELETED!`);
  };

  const deleteOfflineMap = async (map) => {
    let mapID = map.id;
    console.log(`Deleting Map, ${map.name}, with ID of ${map.id} Here`);
    mapID === 'mapwarper' ? map.name : map.id;
    map.source === 'mapbox_styles' && mapID.includes('/') ? mapID = mapID.split('/')[1] : mapID;

    const cacheFolderExists = await RNFS.exists(APP_DIRECTORIES.TILE_CACHE + mapID);
    const zipFileExists = await RNFS.exists(APP_DIRECTORIES.TILE_ZIP + map.mapId + '.zip');
    const tileTempFileExists = await RNFS.exists(APP_DIRECTORIES.TILE_TEMP + '/' + map.mapId);
    console.log(cacheFolderExists, zipFileExists, tileTempFileExists);
    //first, delete folder with tiles
    if (cacheFolderExists) await RNFS.unlink(APP_DIRECTORIES.TILE_CACHE + mapID);
    // Deleting supporting folders
    if (zipFileExists) await RNFS.unlink(APP_DIRECTORIES.TILE_ZIP + map.mapId + '.zip');
    if (tileTempFileExists) await RNFS.unlink(APP_DIRECTORIES.TILE_TEMP + map.mapId);
    dispatch(deletedOfflineMap(map.id));
    console.log(`Deleted ${map.name} offline map from device.`);
  };

  const deleteProfileImageFile = async () => {
    try {
      let fileExists = await doesFileExist(APP_DIRECTORIES.PROFILE_IMAGE);
      if (fileExists) await deleteFromDevice(APP_DIRECTORIES.PROFILE_IMAGE);
    }
    catch (err) {
      console.error('Error Deleting Profile Image File.', err);
    }
  };

  // Delete the folder used for downsized images
  const deleteTempImagesFolder = async () => {
    try {
      const tempImagesDownsizedDirectory = APP_DIRECTORIES.APP_DIR + '/TempImages';
      let dirExists = await doesDeviceDirExist(tempImagesDownsizedDirectory);
      if (dirExists) await deleteFromDevice(tempImagesDownsizedDirectory);
    }
    catch (err) {
      console.error('Error Deleting Temp Images Folder.', err);
    }
  };

  const doesBackupFileExist = (filename) => {
    return RNFS.exists(APP_DIRECTORIES.BACKUP_DIR + filename + '/data.json');
  };

  const doesDeviceBackupDirExist = async (subDirectory, isExternal) => {
    if (isExternal && Platform.OS === 'android') {
      console.log('Checking Downloads dir', APP_DIRECTORIES.DOWNLOAD_DIR_ANDROID);
      const exists = await RNFS.exists(APP_DIRECTORIES.DOWNLOAD_DIR_ANDROID);
      console.log('External Directory exists?:', exists);
      // !exists && await makeDirectory(APP_DIRECTORIES.DOWNLOAD_DIR_ANDROID);
      dispatch(doesDownloadsDirectoryExist(exists));
    }
    if (subDirectory !== undefined) {
      if (isExternal) {
        console.log('SUB-DIR isExternal', APP_DIRECTORIES.DOWNLOAD_DIR_ANDROID + subDirectory);
        return await RNFS.exists(APP_DIRECTORIES.DOWNLOAD_DIR_ANDROID + subDirectory);
      }
      else {
        const exists = await RNFS.exists(APP_DIRECTORIES.BACKUP_DIR + subDirectory);
        console.log(APP_DIRECTORIES.BACKUP_DIR + subDirectory + ' Exists:' + exists);
        return exists;
      }
    }
    else {
      const exists = await RNFS.exists(APP_DIRECTORIES.BACKUP_DIR);
      console.log('Backup Directory exists?:', exists);
      dispatch(doesBackupDirectoryExist(exists));
      return exists;
    }
  };

  // TODO: Check to consolidate with doesDeviceDirExist();
  const doesDeviceDirectoryExist = async (directory) => {
    try {
      console.log('Checking if directory exists...', directory);
      let checkDirSuccess = await RNFS.exists(directory);
      if (!checkDirSuccess) checkDirSuccess = await createAppDirectory(directory);
      if (checkDirSuccess) console.log('Directory exists:', directory);
      else throw Error;
      return checkDirSuccess;
    }
    catch (err) {
      console.error('Error in doesDeviceDirectoryExist()', err);
      throw Error(err);
    }
  };

  // TODO: Check to consolidate with doesDeviceDirectoryExist();
  const doesDeviceDirExist = async (dir) => {
    return await RNFS.exists(dir);
  };

  const doesFileExist = async (path, file = '') => {
    return await RNFS.exists(path + file);
  };

  const doesMicroProjectPDFExist = async (projectId) => {
    const microPDF = APP_DIRECTORIES.MICRO + projectId + '/' + 'project.pdf';
    return await RNFS.exists(microPDF);
  };

  const downloadAndSaveMap = async (downloadOptions) => {
    const res = await RNFS.downloadFile(downloadOptions).promise;
    if (res.statusCode === 200) console.log(`Download Complete to ${downloadOptions.toFile}`);
    else throw Error;
  };

  const downloadAndSaveProfileImage = async (encodedLogin) => {
    const profileImageURL = getProfileImageURL();
    const exists = await doesDeviceDirExist(APP_DIRECTORIES.IMAGES);
    if (!exists) await makeDirectory(APP_DIRECTORIES.IMAGES);
    return await RNFS.downloadFile({
      fromUrl: profileImageURL,
      toFile: APP_DIRECTORIES.PROFILE_IMAGE,
      begin: res => console.log('Starting to download Image', 'profile', res),
      headers: {
        'Authorization': 'Basic ' + encodedLogin,
        'Accept': 'application/json',
      },
    }).promise.then(async (res) => {
        console.log('RNFS Download Profile Image Response:', res);
        if (res.statusCode === 200) {
          console.log(`Profile image downloaded and saved to: ${APP_DIRECTORIES.PROFILE_IMAGE}`);
          return res.statusCode;
        }
        else if (res.statusCode === 404) throw Error('Profile image not found on server');
        else throw Error('Unknown Error');
      },
    )
      .catch((err) => {
        console.warn(`Error Downloading Profile Image using URL ${profileImageURL}:`, err);
      });
  };

  const downloadImageAndSave = async (imageId) => {
    try {
      const path = APP_DIRECTORIES.IMAGES + imageId + '.jpg';
      const imageBlob = await getImage(imageId);
      if (!imageBlob) return false;
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]); // Extract base64 string from result
        reader.onerror = error => reject(error);
        reader.readAsDataURL(imageBlob); // Read the blob as base64
      });
      await RNFS.writeFile(path, base64Data, 'base64');
      console.log('Image saved to:', path);
      return true;
    }
    catch (err) {
      console.error('Error downloading or saving file:', err);
    }
  };

  const exportMicroProjectPDF = async (pdfFile) => {
    await doesDeviceDirectoryExist(APP_DIRECTORIES.MICRO_EXPORTS);
    const destination = APP_DIRECTORIES.MICRO_EXPORTS + pdfFile.name + '.pdf';
    const fileExists = await doesFileExist(destination);
    if (fileExists) await deleteFromDevice(destination);
    const source = pdfFile.file.uri;
    await RNFS.copyFile(source, destination);
    console.log('Exported StraboMicro Project to', destination);
  };

  const getDeviceStorageSpaceInfo = async () => {
    let imageSizeText;
    const {freeSpace, totalSpace} = await RNFS.getFSInfo();
    console.log(`Device storage is ${freeSpace}/${totalSpace}`);
    if (freeSpace < 1024) imageSizeText = freeSpace + ' bytes';
    else if (freeSpace < 1048576) imageSizeText = (freeSpace / 1024).toFixed(3) + ' kB';
    else if (freeSpace < 1073741824) imageSizeText = (freeSpace / 1048576).toFixed(2) + ' MB';
    else imageSizeText = (freeSpace / 1073741824).toFixed(3) + ' GB';
    console.log('The available space is:', imageSizeText);
  };

  const getExternalProjectData = async () => {
    try {
      const result = await safePick({type: [types.zip]});
      // Check if user canceled the picker
      if (!result) {
        console.log('User canceled file selection');
        dispatch(setLoadingStatus({bool: false, view: 'home'}));
        return null;
      }

      const [{name, uri}] = result;
      if (name && uri) {
        console.log('Picked ZIP File:', name, uri);
        const [localCopy] = await keepLocalCopy({
          destination: 'cachesDirectory',
          files: [{uri: uri, fileName: name}],
          // presentationStyle: Platform.OS === 'ios' && 'fullScreen',
          transitionStyle: Platform.OS === 'ios' && 'flipHorizontal',
          type: [types.zip],
        });

        if (localCopy.status === 'success') {
          console.log(localCopy.localUri);
          return {localUri: localCopy.localUri, name: name};
        }
        else throw Error;
      }
      else throw Error;
    }
    catch (err) {
      console.error('Error getting external project data', err);
      dispatch(setLoadingStatus({bool: false, view: 'home'}));
    }
  };

  // Grab out the name from project.json for a saved MicroProject
  const getMicroProjectName = async (projectId) => {
    const microJSON = APP_DIRECTORIES.MICRO + projectId + '/' + 'project.json';
    if (await RNFS.exists(microJSON)) {
      const file = await readFile(microJSON);
      const fileAsJSON = JSON.parse(file);
      return fileAsJSON.name || 'Unknown';
    }
    return 'Unknown';
  };

  // Grab the timestamp from project.json for a saved MicroProject
  const getSavedMicroProjectModifiedTimestamp = async (projectId) => {
    const microJSON = APP_DIRECTORIES.MICRO + projectId + '/' + 'project.json';
    if (await RNFS.exists(microJSON)) {
      const file = await readFile(microJSON);
      const fileAsJSON = JSON.parse(file);
      // console.log('fileAsJSON', fileAsJSON);
      return fileAsJSON.modifiedtimestamp || undefined;
    }
    else return undefined;
  };

  const isPickDocumentCanceled = (err) => {
    console.log('Checking if pick was canceled:', err);
    const wasCanceled = handleError(err);
    console.log('Is Pick Document Canceled?', wasCanceled);
    return wasCanceled;
  };

  const makeDirectory = async (directory) => {
    try {
      const exists = await RNFS.exists(directory);
      if (!exists) return await RNFS.mkdir(directory);
      else return Promise.resolve();
    }
    catch (err) {
      console.error('Unable to create directory', directory, 'ERROR:', err);
    }
  };

  const moveFile = async (source, destination) => {
    try {
      await RNFS.moveFile(source, destination);
    }
    catch (err) {
      console.error('Error moving file', err);
    }
  };

  const openURL = async (url) => {
    console.log(url + APP_DIRECTORIES.BACKUP_DIR);
    try {
      if (url === 'ProjectBackups') {
        url = APP_DIRECTORIES.SHARED_DOCUMENTS_PATH_IOS + APP_DIRECTORIES.BACKUP_DIR + url;
      }
      const initialUrl = await Linking.canOpenURL(url);
      console.log(initialUrl);
      if (initialUrl) Linking.openURL(url).catch(err => console.error('ERROR', err));
      else console.log('Could not open:', url);
    }
    catch (err) {
      console.error('Error opening url', url, ':', err);
    }
  };

  const pickCSV = async () => {
    const result = await safePick({type: [types.csv]});
    // Return null if user canceled
    if (!result) return null;
    const [res] = result;
    return res;
  };

  const readDeviceJSONFile = async (fileName) => {
    try {
      const dataFile = '/data.json';
      console.log(APP_DIRECTORIES.BACKUP_DIR + fileName + dataFile);
      const response = await readFile(APP_DIRECTORIES.BACKUP_DIR + fileName + dataFile);
      console.log(JSON.parse(response));
      return JSON.parse(response);
    }
    catch (err) {
      console.error('Error reading JSON file', err);
    }
  };

  const readDirectory = async (directory) => {
    console.log('Reading directory', directory);
    const exists = await RNFS.exists(directory);
    if (exists) {
      const files = await RNFS.readdir(directory);
      console.log('Directory', directory, ' files:', files);
      return files;
    }
    else console.log('Directory', directory, 'does not exist');
  };

  const readDirectoryForMapFiles = async () => {
    const exists = await RNFS.exists(APP_DIRECTORIES.TILES_DIRECTORY);
    console.log('Offline maps directory exists? ', exists);
    if (exists) {
      const files = await RNFS.readdir(APP_DIRECTORIES.TILE_CACHE);
      console.log(files);
      return files;
    }
    else throw Error('Offline maps directory does not exist!');
  };

  const readDirectoryForMapTiles = async (directory, mapId) => {
    try {
      let tiles = [];
      mapId = mapId.includes('/') ? mapId.split('/')[1] : mapId;
      const exists = await RNFS.exists(directory + mapId + '/tiles');
      console.log('Map tiles cache tiles directory:', exists);
      if (exists) {
        tiles = await RNFS.readdir(directory + mapId + '/tiles');
        // console.log('Tiles', tiles);
      }
      return tiles;
    }
    catch (err) {
      console.error('Error reading map tile directory', err);
    }
  };

  const readFile = async (source) => {
    try {
      return await RNFS.readFile(source);
    }
    catch (e) {
      console.error('Error reading file as utf8', e);
      try {
        return await RNFS.readFile(source, 'ascii');
      }
      catch (e2) {
        console.error('Error reading file as ascii:', e2);
        const errorMessage = e2.message || 'Unable to read data file.';
        throw Error(errorMessage);
      }
    }
  };

  const requestReadDirectoryPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Need permission to read Downloads Folder',
          message:
            'StraboField needs permission to access your Downloads Folder to retrieve backups,',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can read the folder');
      }
      else {
        console.log('Folder read permission denied');
      }
    }
    catch (err) {
      console.warn(err);
    }
  };

  const unZipAndCopyImportedData = async (zipFile) => {
    try {
      let fileName = '';
      if (Platform.OS === 'android') {
        if (await RNFS.exists(APP_DIRECTORIES.EXPORT_FILES_ANDROID)) {
          await RNFS.copyFile(zipFile.localUri, APP_DIRECTORIES.EXPORT_FILES_ANDROID + zipFile.name);
          console.log('Files copied to Android export folder!');
        }
        else {
          await makeDirectory(APP_DIRECTORIES.EXPORT_FILES_ANDROID);
          await unZipAndCopyImportedData(zipFile);
        }
      }
      fileName = zipFile.name.replace('.zip', '');
      const source = Platform.OS === 'ios' ? zipFile.localUri : APP_DIRECTORIES.EXPORT_FILES_ANDROID + zipFile.name;
      const dest = Platform.OS === 'ios' ? APP_DIRECTORIES.BACKUP_DIR + fileName : APP_DIRECTORIES.BACKUP_DIR + fileName;

      console.log('SOURCE', source);
      console.log('DEST', dest);

      await unzip(source, dest);
    }
    catch (err) {
      console.error('Error unzipping imported file', err);
      throw Error(err);
    }
  };

  const writeFileToDevice = async (path, filename, data) => {
    try {
      console.log('Writing file to internal storage ...', path + '/' + filename);
      await RNFS.writeFile(path + '/' + filename, JSON.stringify(data), 'utf8');
      console.log('Finished writing file to internal storage', path + '/' + filename);
    }
    catch (err) {
      console.error('Error Writing File!', err.message);
      throw Error(err);
    }
  };

  return {
    copyFiles,
    createProjectDirectories,
    deleteFromDevice,
    deleteOfflineMap,
    deleteProfileImageFile,
    deleteTempImagesFolder,
    doesBackupFileExist,
    doesDeviceBackupDirExist,
    doesDeviceDirectoryExist,
    doesDeviceDirExist,
    doesFileExist,
    doesMicroProjectPDFExist,
    downloadAndSaveMap,
    downloadAndSaveProfileImage,
    downloadImageAndSave,
    exportMicroProjectPDF,
    getDeviceStorageSpaceInfo,
    getExternalProjectData,
    getMicroProjectName,
    getSavedMicroProjectModifiedTimestamp,
    isPickDocumentCanceled,
    makeDirectory,
    moveFile,
    openURL,
    pickCSV,
    readDeviceJSONFile,
    readDirectory,
    readDirectoryForMapFiles,
    readDirectoryForMapTiles,
    readFile,
    requestReadDirectoryPermission,
    unZipAndCopyImportedData,
    writeFileToDevice,
  };
};

export default useDevice;
