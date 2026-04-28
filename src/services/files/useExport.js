import {Platform} from 'react-native';

import ReactNativeBlobUtil from 'react-native-blob-util';
import {zip} from 'react-native-zip-archive';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES, APP_EXPORT_DIRECTORY} from './directories.constants';
import {addedStatusMessage, clearedStatusMessages, removedLastStatusMessage} from '../../modules/home/home.slice';
import {PAGE_KEYS} from '../../modules/page/pageKeys.constants';
import {setBackupFileName} from '../../modules/project/projects.slice';
import {hasSpace, isEmpty} from '../../shared/helpers';
import useDevice from '../device/useDevice';

let imageBackupFailures = 0;
let imageSuccess = 0;

const useExport = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const mapNamesDb = useSelector(state => state.offlineMap.offlineMaps);
  const otherMapsDb = useSelector(state => state.map.customMaps);
  const projectDb = useSelector(state => state.project);
  const spotsDb = useSelector(state => state.spot.spots);
  const userDb = useSelector(state => state.user);

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

  /* Derived Variables */

  const otherMapsDbCopy = JSON.parse(JSON.stringify(otherMapsDb));
  const userDbCopy = JSON.parse(JSON.stringify(userDb));
  const configDb = {user: userDbCopy, other_maps: otherMapsDbCopy};
  let dataForExport = {
    mapNamesDb: mapNamesDb,
    mapTilesDb: {},
    otherMapsDb: otherMapsDb,
    projectDb: projectDb,
    spotsDb: spotsDb,
  };

  /* Internal Functions */

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

  const gatherDataForBackup = async (filename) => {
    try {
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Saving Project Data...'));
      console.log(dataForExport);
      await saveFile(APP_DIRECTORIES.BACKUP_DIR + filename, dataForExport, 'data.json');
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Finished Saving Project Data'));
    }
    catch (err) {
      console.error('Error Saving Data!', err);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Saving Project Data.' + err));
    }
  };

  const gatherImagesForDistribution = async (data, fileName, isBeingExported) => {
    try {
      const deviceDir = isBeingExported ? APP_EXPORT_DIRECTORY : APP_DIRECTORIES.BACKUP_DIR;
      console.log('data:', data);
      await doesDeviceDirectoryExist(deviceDir + fileName + '/images');
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Looking for Images...'));
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
      // Copies report images to /Images folder
      if (data.projectDb.project.reports) {
        await Promise.all(
          Object.values(data.projectDb.project.reports).map(async (report) => {
            if (!isEmpty(report?.images)) {
              console.log('Report images:');
              await Promise.all(
                report.images.map(async (image) => {
                  await moveDistributedImage(image.id, fileName, deviceDir);
                }),
              );
            }
          }),
        );
      }
    }
    catch (err) {
      console.error('Error Backing Up Images!', err);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Backing Up Images!' + err));
    }
  };

  const gatherMapsForDistribution = async (data, fileName, isBeingExported) => {
    try {
      const maps = data.mapNamesDb;
      const mapCount = Object.values(maps).length;
      const deviceDir = isBeingExported ? APP_EXPORT_DIRECTORY : APP_DIRECTORIES.BACKUP_DIR;
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Looking for Offline Maps...'));
      if (!isEmpty(maps)) {
        console.log('Maps exist.', maps);
        await doesDeviceDirectoryExist(deviceDir + fileName + '/maps');
        await zip(APP_DIRECTORIES.TILE_CACHE, deviceDir + fileName + '/maps/OfflineTiles.zip');
        dispatch(removedLastStatusMessage());
        dispatch(addedStatusMessage(`Offline Map${mapCount > 1 ? 's' : ''} backed up: ${mapCount}`));
      }
      else {
        dispatch(removedLastStatusMessage());
        dispatch(addedStatusMessage('No offline maps to back up.'));
      }
    }
    catch (err) {
      console.error('Error Backing Up Offline Maps.');
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Exporting Backing Up Maps!' + err));
    }
  };

  const gatherOtherMapsForDistribution = async (exportedFileName, isBeingExported) => {
    try {
      console.log(configDb);
      const deviceDir = isBeingExported ? APP_EXPORT_DIRECTORY : APP_DIRECTORIES.BACKUP_DIR;
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Looking for Custom Maps...'));
      if (!isEmpty(configDb.other_maps)) {
        await saveFile(deviceDir + exportedFileName, configDb.other_maps, 'other_maps.json');
        dispatch(removedLastStatusMessage());
        dispatch(addedStatusMessage('Finished Backing Up Custom Maps.'));
      }
      else {
        dispatch(removedLastStatusMessage());
        dispatch(addedStatusMessage('No custom maps to back up.'));
      }
    }
    catch (err) {
      console.error('Error Exporting Other Maps', err);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Backing Up Custom Maps!' + err));
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

  const saveFile = async (directory, data, filename) => {
    await doesDeviceDirectoryExist(directory);
    await writeFileToDevice(directory, filename, data);
  };

  /* Exported Functions */

  const backupTags = async (backupFileName, isGeologicUnits) => {

    const tagsToBackup = (projectDb.project.tags || []).reduce((acc, tag) => {
      const {spots, features, ...rest} = tag;
      return (isGeologicUnits && rest.type === PAGE_KEYS.GEOLOGIC_UNITS)
      || (!isGeologicUnits && rest.type !== PAGE_KEYS.GEOLOGIC_UNITS) ? [...acc, rest] : acc;
    }, []);

    console.log(isGeologicUnits ? 'Geologic Units' : 'Tags', 'to backup:', tagsToBackup);

    const subFolder = isGeologicUnits ? 'GeologicUnits' : 'Tags';
    const jsonFileName = backupFileName + '.json';

    if (Platform.OS === 'ios') {
      const exportPath = APP_DIRECTORIES.EXPORT_FILES_IOS + subFolder + '/';
      await saveFile(exportPath, tagsToBackup, jsonFileName);
      console.log('File saved to:', exportPath + jsonFileName);
    }
    else {
      // Write to temp file first, then copy to Downloads via MediaStore (required for Android 11+)
      const tempPath = APP_DIRECTORIES.EXPORT_FILES_ANDROID + jsonFileName;
      await saveFile(APP_DIRECTORIES.EXPORT_FILES_ANDROID, tagsToBackup, jsonFileName);
      const result = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
        {
          name: jsonFileName,
          parentFolder: 'StraboSpot2/Backups/' + subFolder,
          mimeType: 'application/json',
        },
        'Download',
        tempPath,
      );
      console.log('File written to Downloads:', result);
      await deleteFromDevice(APP_DIRECTORIES.EXPORT_FILES_ANDROID, jsonFileName);
    }
    console.log('Finished Exporting');
    dispatch(clearedStatusMessages());
  };

  const initializeBackup = async (fileName) => {
    try {
      if (hasSpace(fileName)) fileName = fileName.replaceAll(' ', '_');

      dispatch(setBackupFileName(fileName));
      // dispatch(setIsBackupModalVisible(false));
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Saving Project to Device...'));

      const hasBackupDir = await doesDeviceBackupDirExist();
      console.log('Has Backup Dir?: ', hasBackupDir);
      if (hasBackupDir) await backupProjectToDevice(fileName);
      else {
        await makeDirectory(APP_DIRECTORIES.BACKUP_DIR);
        await backupProjectToDevice(fileName);
      }
    }
    catch (err) {
      console.error('Error Saving Project!: ', err);
    }
  };

  const zipAndExportProjectFolder = async (selectedBackupFile, isBeingExported) => {
    // try {
    // dispatch(setLoadingStatus({view: 'modal', bool: true}));
    await makeDirectory(APP_EXPORT_DIRECTORY + selectedBackupFile);

    // Make temp directory for the export files to be zipped up.
    console.log('Directory made:', APP_EXPORT_DIRECTORY);

    // const dateAndTime = moment(new Date()).format('YYYY-MM-DD_hmma');
    const source = APP_DIRECTORIES.BACKUP_DIR + selectedBackupFile + '/data.json';
    const destination = APP_EXPORT_DIRECTORY + selectedBackupFile;
    console.log(selectedBackupFile);

    const dataFile = await readFile(APP_DIRECTORIES.BACKUP_DIR + selectedBackupFile + '/data.json');
    const exportedJSON = JSON.parse(dataFile);
    await copyFiles(source, `${destination}/data.json`);
    console.log('Files Copied', exportedJSON);
    dispatch(removedLastStatusMessage());
    await gatherImagesForDistribution(exportedJSON, selectedBackupFile, isBeingExported);
    console.log('Images copied to:', destination);
    await gatherMapsForDistribution(exportedJSON, selectedBackupFile, isBeingExported);
    console.log('Map tiles copied to:', destination);
    await gatherOtherMapsForDistribution(selectedBackupFile, isBeingExported);

    const zipFileName = selectedBackupFile + '.zip';

    if (Platform.OS === 'ios') {
      // iOS: Zip directly to Distribution folder
      const zipPath = APP_DIRECTORIES.EXPORT_FILES_IOS;
      const path = await zip(APP_EXPORT_DIRECTORY + selectedBackupFile, zipPath + zipFileName);
      console.log(`zip completed at ${path}`);
    }
    else {
      // Android: Zip to private directory first, then copy to Downloads via MediaStore
      const tempZipPath = APP_EXPORT_DIRECTORY + zipFileName;
      await zip(APP_EXPORT_DIRECTORY + selectedBackupFile, tempZipPath);
      console.log(`zip completed at ${tempZipPath}`);

      // Copy to Downloads folder using MediaStore (required for Android 11+)
      const result = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
        {
          name: zipFileName,
          parentFolder: 'StraboSpot2/Backups',
          mimeType: 'application/zip',
        },
        'Download',
        tempZipPath,
      );
      console.log('File copied to Downloads:', result);

      // Clean up temp zip file
      await deleteFromDevice(APP_EXPORT_DIRECTORY, zipFileName);
    }

    const deleteTempFolder = await deleteFromDevice(APP_EXPORT_DIRECTORY, selectedBackupFile);
    console.log('Folder', deleteTempFolder);
    console.log('All Done Exporting');
    dispatch(clearedStatusMessages());
    // throw Error('This is an ERROR YEEHAW');

    // return 'complete';
    // }
    // catch (e) {
    //   const warningMessage = 'Error Exporting\n' + e;
    //   dispatch(clearedStatusMessages());
    //   dispatch(addedStatusMessage(warningMessage));
    //   dispatch(setIsWarningMessagesModalVisible(true));
    //   throw Error;
    // }
  };

  return {
    backupTags,
    initializeBackup,
    zipAndExportProjectFolder,
  };
};

export default useExport;
