import {PermissionsAndroid, Platform} from 'react-native';

import {zip} from 'react-native-zip-archive';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES} from './directories.constants';
import useDevice from './useDevice';
import {
  addedStatusMessage,
  clearedStatusMessages,
  removedLastStatusMessage,
  setIsWarningMessagesModalVisible,
} from '../modules/home/home.slice';
import {setBackupFileName} from '../modules/project/projects.slice';
import {isEmpty, unixToDateTime} from '../shared/Helpers';

const useExport = () => {
  const dispatch = useDispatch();
  const backupFileName = useSelector(state => state.project.backupFileName);
  const mapNamesDb = useSelector(state => state.offlineMap.offlineMaps);
  const otherMapsDb = useSelector(state => state.map.customMaps);
  const projectDb = useSelector(state => state.project);
  const spotsDb = useSelector(state => state.spot.spots);
  const userDb = useSelector(state => state.user);

  const appExportDirectory = Platform.OS === 'ios' ? APP_DIRECTORIES.EXPORT_FILES_IOS : APP_DIRECTORIES.EXPORT_FILES_ANDROID;

  const otherMapsDbCopy = JSON.parse(JSON.stringify(otherMapsDb));
  const userDbCopy = JSON.parse(JSON.stringify(userDb));
  const configDb = {user: userDbCopy, other_maps: otherMapsDbCopy};

  const {
    copyFiles,
    deleteFromDevice,
    doesDeviceBackupDirExist,
    doesDeviceDirExist,
    doesDeviceDirectoryExist,
    makeDirectory,
    readFile,
    writeFileToDevice,
  } = useDevice();
  let imageBackupFailures = 0;
  let imageSuccess = 0;

  let dataForExport = {
    mapNamesDb: mapNamesDb,
    mapTilesDb: {},
    otherMapsDb: otherMapsDb,
    projectDb: projectDb,
    spotsDb: spotsDb,
  };

  const autoBackupProjectToDevice = async () => {
    const date = Date.now();
    const timeStamp = unixToDateTime(date);


    // exportData(APP_DIRECTORIES.AUTO_BACKUP, dataForExport, timeStamp);
  };

  const backupProjectToDevice = async (fileName) => {
    await gatherDataForBackup(fileName);
    console.log('Added Project Data to backup.');
    await gatherOtherMapsForDistribution(fileName);
    console.log('Added Other Maps to backup.');
    await gatherMapsForDistribution(dataForExport, fileName);
    console.log('Added Maps tiles to backup.');
    await gatherImagesForDistribution(dataForExport, fileName);
    console.log('Added Images to backup.');
  };

  const exportData = async (directory, data, filename) => {
    await doesDeviceDirectoryExist(directory);
    await writeFileToDevice(directory, filename, data);
  };

  const gatherDataForBackup = async (filename) => {
    try {
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Exporting Project Data...'));
      console.log(dataForExport);
      await exportData(APP_DIRECTORIES.BACKUP_DIR + filename, dataForExport, 'data.json');
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Finished Exporting Project Data'));
    }
    catch (err) {
      console.error('Error Exporting Data!', err);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Exporting Project Data.' + err));
    }
  };

  const gatherImagesForDistribution = async (data, fileName, isBeingExported) => {
    try {
      const deviceDir = isBeingExported ? appExportDirectory : APP_DIRECTORIES.BACKUP_DIR;
      console.log('data:', data);
      await doesDeviceDirectoryExist(deviceDir + fileName + '/images');
      dispatch(addedStatusMessage((isBeingExported ? 'Exporting' : 'Backing up') + ' Images...'));
      if (data.spotsDb) {
        console.groupCollapsed('Found Spots. Gathering Images...');
        await Promise.all(
          Object.values(data.spotsDb).map(async (spot) => {
            if (spot.properties.images) {
              console.log('Spot', spot.properties.name, '(' + spot.properties.id + ') has',
                spot.properties.images.length, 'images [' + spot.properties.images.map(i => i.id).join(', ') + ']',
                spot.properties.images);
              await Promise.all(spot.properties.images.map(async (image) => {
                  await moveDistributedImage(image.id, fileName, deviceDir);
                }),
              );
            }
          }),
        );
        console.log('Finished Gathering Images');
        console.groupEnd();
        dispatch(removedLastStatusMessage());
        if (imageBackupFailures > 0) {
          dispatch(addedStatusMessage(
            `Images backed up: ${imageSuccess}\nImages missing: ${imageBackupFailures}`,
          ));
        }
        else dispatch(addedStatusMessage(`${imageSuccess} Images backed up.`));
      }
    }
    catch (err) {
      console.error('Error Backing Up Images!', err);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Exporting Images!' + err));
    }
  };

  const gatherMapsForDistribution = async (data, fileName, isBeingExported) => {
    try {
      const maps = data.mapNamesDb;
      const mapCount = Object.values(maps).length;
      const deviceDir = isBeingExported ? appExportDirectory : APP_DIRECTORIES.BACKUP_DIR;
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Exporting Offline Maps...'));
      if (!isEmpty(maps)) {
        console.log('Maps exist.', maps);
        await doesDeviceDirectoryExist(deviceDir + fileName + '/maps');
        await zip(APP_DIRECTORIES.TILE_CACHE, deviceDir + fileName + '/maps/OfflineTiles.zip');
        dispatch(removedLastStatusMessage());
        dispatch(addedStatusMessage(`Offline Map${mapCount > 1 ? 's' : ''} backed up: ${mapCount}`));
      }
      else {
        dispatch(removedLastStatusMessage());
        dispatch(addedStatusMessage('No offline maps to export.'));
      }
    }
    catch (err) {
      console.error('Error Exporting Offline Maps.');
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Exporting Offline Maps!' + err));
    }
  };

  const gatherOtherMapsForDistribution = async (exportedFileName, isBeingExported) => {
    try {
      console.log(configDb);
      const deviceDir = isBeingExported ? appExportDirectory : APP_DIRECTORIES.BACKUP_DIR;
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Exporting Custom Maps...'));
      if (!isEmpty(configDb.other_maps)) {
        await exportData(deviceDir + exportedFileName, configDb.other_maps, 'other_maps.json');
        dispatch(removedLastStatusMessage());
        dispatch(addedStatusMessage('Finished Exporting Custom Maps.'));
      }
      else {
        dispatch(removedLastStatusMessage());
        dispatch(addedStatusMessage('No custom maps to export.'));
      }
    }
    catch (err) {
      console.error('Error Exporting Other Maps', err);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Exporting Custom Maps!' + err));
    }
  };

  const initializeBackup = async (fileName) => {
    try {
      dispatch(setBackupFileName(fileName));
      // dispatch(setIsBackupModalVisible(false));
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Backing up Project to Device...'));

      const hasBackupDir = await doesDeviceBackupDirExist();
      console.log('Has Backup Dir?: ', hasBackupDir);
      if (hasBackupDir) await backupProjectToDevice(fileName);
      else {
        await makeDirectory(APP_DIRECTORIES.BACKUP_DIR);
        await backupProjectToDevice(fileName);
      }
    }
    catch (err) {
      console.error('Error Backing Up Project!: ', err);
    }
  };

  const moveDistributedImage = async (image_id, fileName, directory) => {
    try {
      const imageExists = await doesDeviceDirExist(APP_DIRECTORIES.IMAGES + image_id + '.jpg');
      if (imageExists) {
        await copyFiles(APP_DIRECTORIES.IMAGES + image_id + '.jpg',
          directory + fileName + '/images/' + image_id + '.jpg');
        imageSuccess++;
        console.log(imageSuccess, 'Copied image to backup:', image_id);
      }
      else throw Error('Image not found.');
    }
    catch (err) {
      imageBackupFailures++;
      console.log(imageBackupFailures, 'ERROR Copying Image', err.toString(), image_id);
    }
  };

  const requestWriteDirectoryPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Need permission to read Downloads Folder',
          message:
            'StraboField needs permission to access your Downloads Folder to save backups,',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) console.log('You can read the folder');
      else console.log('Folder read permission denied');
    }
    catch (err) {
      console.warn(err);
    }
  };

  const zipAndExportProjectFolder = async (isBeingExported) => {
    try {
      // dispatch(setLoadingStatus({view: 'modal', bool: true}));
      await makeDirectory(appExportDirectory + backupFileName);

      // Make temp directory for the export files to be zipped up.
      console.log('Directory made:', appExportDirectory);

      // const dateAndTime = moment(new Date()).format('YYYY-MM-DD_hmma');
      const source = APP_DIRECTORIES.BACKUP_DIR + backupFileName + '/data.json';
      const destination = appExportDirectory + backupFileName;
      Platform.OS === 'android' && await requestWriteDirectoryPermission();
      console.log(backupFileName);

      const dataFile = await readFile(APP_DIRECTORIES.BACKUP_DIR + backupFileName + '/data.json');
      const exportedJSON = JSON.parse(dataFile);
      await copyFiles(source, `${destination}/data.json`);
      console.log('Files Copied', exportedJSON);
      dispatch(removedLastStatusMessage());
      await gatherImagesForDistribution(exportedJSON, backupFileName, isBeingExported);
      console.log('Images copied to:', destination);
      await gatherMapsForDistribution(exportedJSON, backupFileName, isBeingExported);
      console.log('Map tiles copied to:', destination);
      await gatherOtherMapsForDistribution(backupFileName, isBeingExported);
      const zipPath = Platform.OS === 'ios' ? APP_DIRECTORIES.EXPORT_FILES_IOS : APP_DIRECTORIES.DOWNLOAD_DIR_ANDROID;
      const path = await zip(appExportDirectory + backupFileName,
        zipPath + backupFileName + '.zip');

      const deleteTempFolder = deleteFromDevice(appExportDirectory, backupFileName);
      console.log('Folder', deleteTempFolder);
      console.log(`zip completed at ${path}`);
      console.log('All Done Exporting');
    }
    catch (e) {
      const warningMessage = 'Error Exporting\n' + e;
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage(warningMessage));
      dispatch(setIsWarningMessagesModalVisible(true));
      throw Error;
    }
  };

  return {
    autoBackupProjectToDevice: autoBackupProjectToDevice,
    initializeBackup: initializeBackup,
    zipAndExportProjectFolder: zipAndExportProjectFolder,
  };
};

export default useExport;
