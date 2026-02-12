import {unzip} from 'react-native-zip-archive';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES} from './directories.constants';
import useDevice from './useDevice';
import useResetState from './useResetState';
import {addedStatusMessage, clearedStatusMessages, removedLastStatusMessage} from '../modules/home/home.slice';
import {addedCustomMapsFromBackup} from '../modules/maps/maps.slice';
import {addedMapsFromDevice} from '../modules/maps/offline-maps/offlineMaps.slice';
import {
  addedDatasets,
  addedProject,
  setActiveDatasets,
  setSelectedProject,
  setTargetDataset,
} from '../modules/project/projects.slice';
import {addedSpotsFromDevice} from '../modules/spots/spots.slice';
import {isEmpty} from '../shared/Helpers';
import {persistor} from '../store/ConfigureStore';

const useImport = () => {
  let isOldBackup;
  let fileCount = 0;
  let neededTiles = 0;
  let notNeededTiles = 0;
  let mapFailures = 0;

  const {clearProject} = useResetState();

  const dispatch = useDispatch();
  const project = useSelector(state => state.project.project);

  const {
    copyFiles,
    deleteFromDevice,
    doesDeviceBackupDirExist,
    doesDeviceDirectoryExist,
    doesDeviceDirExist,
    moveFile,
    readDeviceJSONFile,
    readDirectory,
  } = useDevice();

  const copyImages = async (fileName) => {
    try {
      const existsWithLowercase = await doesDeviceDirExist(APP_DIRECTORIES.BACKUP_DIR
        + fileName + '/images');
      const existsWithCapital = await doesDeviceDirExist(APP_DIRECTORIES.BACKUP_DIR
        + fileName + '/Images');
      const imagesFolderName = existsWithLowercase ? '/images' : '/Images';
      if (existsWithCapital || existsWithLowercase) {
        const imageFiles = await readDirectory(APP_DIRECTORIES.BACKUP_DIR
          + fileName + imagesFolderName);
        console.log(imageFiles);
        await doesDeviceDirectoryExist(APP_DIRECTORIES.IMAGES);
        if (!isEmpty(imageFiles)) {
          imageFiles.map(async (image) => {
            await copyFiles(APP_DIRECTORIES.BACKUP_DIR + fileName + imagesFolderName + '/' + image,
              APP_DIRECTORIES.IMAGES + image);
          });
          dispatch(removedLastStatusMessage());
          dispatch(addedStatusMessage('Finished importing image files.'));
        }
        else {
          dispatch(removedLastStatusMessage());
          dispatch(addedStatusMessage('No image files.'));
        }
      }
      else {
        dispatch(removedLastStatusMessage());
        dispatch(addedStatusMessage('No image files.'));
      }
    }
    catch (err) {
      console.error('Error checking existence of backup images dir.', err);
    }
  };

  const copyZipMapsToProject = async (fileName, isExternal) => {
    try {
      const sourceDir = isExternal ? APP_DIRECTORIES.DOWNLOAD_DIR_ANDROID : APP_DIRECTORIES.BACKUP_DIR;
      const checkDirSuccess = await doesDeviceBackupDirExist(fileName + '/maps');
      console.log('Found map zips folder', checkDirSuccess);
      if (checkDirSuccess) {
        await doesDeviceDirectoryExist(APP_DIRECTORIES.APP_DIR);
        await doesDeviceDirectoryExist(APP_DIRECTORIES.TILE_ZIP);
        let zipFiles = await readDirectory(sourceDir + fileName + '/maps');
        if (zipFiles.length <= 2 && zipFiles.includes('OfflineTiles.zip')) {
          isOldBackup = false;
          dispatch(addedStatusMessage('Importing maps...'));
          console.log('New Zip Method');
          zipFiles = zipFiles.filter(zip => zip === 'OfflineTiles.zip');
          await unzipFile(sourceDir + fileName + '/maps/' + zipFiles[0]);
          console.log('Offline Maps File Unzipped!');
        }
        else {
          console.log('Old Zip Method');
          isOldBackup = true;
          await Promise.all(
            zipFiles.map(async fileEntry => await unzipFile(sourceDir + fileName + '/maps/' + fileEntry)),
          );
          console.log('All map zips unzipped');
        }
      }
    }
    catch (err) {
      console.error('Error Copying Maps for Distribution', err);
    }
  };

  const checkForMaps = async (dataFile, selectedProject, isExternal) => {
    let progress;
    const {mapNamesDb, otherMapsDb} = dataFile;
    dispatch(addedStatusMessage('Checking for maps to import...'));
    if (!isEmpty(otherMapsDb)) {
      dispatch(removedLastStatusMessage());
      dispatch(addedCustomMapsFromBackup(otherMapsDb));
      dispatch(addedStatusMessage('Added custom maps.'));
    }
    else {
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('No custom maps to import.'));
    }
    dispatch(addedStatusMessage('Checking for map tiles to import...'));
    if (!isEmpty(mapNamesDb)) {
      await copyZipMapsToProject(selectedProject, isExternal);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Finished importing maps.'));
      dispatch(addedStatusMessage(`Finished copying and ${'\n'}unzipping all files`));
      dispatch(addedStatusMessage('Moving Maps...'));
      progress = await moveFiles(dataFile);
      console.log('fileCount', progress);
      dispatch(addedMapsFromDevice({mapType: 'offlineMaps', maps: mapNamesDb}));
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('---------------------'));
      dispatch(addedStatusMessage(`Map tiles imported: ${progress.fileCount || 0}`));
      dispatch(addedStatusMessage(`Map tiles installed: ${progress.neededTiles || 0}`));
      dispatch(addedStatusMessage(`Map tiles already installed: ${progress.notNeededTiles || 0}`));
      dispatch(addedStatusMessage('Finished moving tiles'));
    }
    else {
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('No maps to import.'));
    }
  };

  const loadProjectFromDevice = async (selectedProject, isExternal) => {
    dispatch(clearedStatusMessages());
    dispatch(addedStatusMessage(`Importing ${selectedProject}...`));

    console.log('SELECTED PROJECT', selectedProject);
    if (selectedProject.includes('.zip')) {
      await unzipBackupFile(selectedProject);
      selectedProject = selectedProject.replace('.zip', '');
    }
    const dirExists = await doesDeviceBackupDirExist(selectedProject);
    if (dirExists) {
      const dataFile = await readDeviceJSONFile(selectedProject);
      if (!isEmpty(project) && dataFile) await persistor.purge();
      const {projectDb, spotsDb} = dataFile;
      if (!isEmpty(project.id) && project.id !== projectDb.project.id) clearProject();
      console.log('DataFile', dataFile);
      dispatch(addedSpotsFromDevice(spotsDb));
      dispatch(addedProject(projectDb.project || projectDb));
      dispatch(addedDatasets(projectDb.datasets));
      if (Object.values(projectDb.datasets).length > 0 && !isEmpty(Object.values(projectDb.datasets)[0])) {
        dispatch(setActiveDatasets({bool: true, dataset: Object.values(projectDb.datasets)[0].id}));
        dispatch(setTargetDataset(Object.values(projectDb.datasets)[0].id));
      }
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage(`${selectedProject}\nProject loaded.`));
      dispatch(addedStatusMessage('Importing image files...'));
      await copyImages(selectedProject);
      await checkForMaps(dataFile, selectedProject, isExternal);
      dispatch(setSelectedProject({project: '', source: ''}));
      dispatch(addedStatusMessage('Complete!'));
      return Promise.resolve({project: dataFile.projectDb.project});
    }
  };

  const moveFiles = async (dataFile) => {
    try {
      let fileEntries = [];
      console.log(dataFile.mapNamesDb);
      await Promise.all(
        Object.values(dataFile.mapNamesDb).map(async (map) => {
          const checkSuccess = await doesDeviceDirectoryExist(
            APP_DIRECTORIES.TILE_CACHE + map.id + '/tiles/');
          if (checkSuccess) {
            console.log('dir exists');
            const files = await readDirectory(APP_DIRECTORIES.TILE_TEMP);
            const mapId = files.find(id => id === map.id);
            const zipID = files.find(zipId => zipId === map.mapId);
            const id = isOldBackup ? zipID : mapId;
            if (id) fileEntries = await readDirectory(APP_DIRECTORIES.TILE_TEMP + id + '/tiles');
            else {
              mapFailures++;
              console.log('Map file not found', mapFailures);
            }
            await moveTile(fileEntries, id, map);
          }
        }),
      );
      console.log('Move Files Promise Complete!!!');
      return {fileCount: fileCount, neededTiles: neededTiles, notNeededTiles: notNeededTiles, mapFailures: mapFailures};
    }
    catch (err) {
      console.error('Error in moveFiles()', err);
    }
  };

  const moveTile = async (tileArray, id, map) => {
    await Promise.all(
      tileArray.map(async (tile) => {
        fileCount++;
        const fileExists = await doesDeviceDirExist(APP_DIRECTORIES.TILE_CACHE + map.id + '/tiles/' + tile);
        if (!fileExists) {
          await moveFile(
            APP_DIRECTORIES.TILE_TEMP + id + '/tiles/' + tile,
            APP_DIRECTORIES.TILE_CACHE + map.id + '/tiles/' + tile);
          neededTiles++;
        }
        else {
          notNeededTiles++;
        }
      }),
    );
  };


  const unzipFile = async (filePath) => {
    try {
      const checkDirSuccess = await doesDeviceDirectoryExist(APP_DIRECTORIES.TILE_TEMP);
      console.log(checkDirSuccess);
      if (checkDirSuccess) {
        if (isOldBackup) {
          const fileExtension = filePath.substring(filePath.lastIndexOf('.') + 1);
          if (fileExtension === 'zip') {
            const source = filePath;
            const dest = APP_DIRECTORIES.TILE_TEMP;
            await unzip(source, dest);
            console.log('unzip completed', filePath, 'to destination:', dest);
          }
        }
        else {
          const fileExtension = filePath.substring(filePath.lastIndexOf('.') + 1);
          if (fileExtension === 'zip') {
            const source = filePath;
            const dest = APP_DIRECTORIES.TILE_TEMP;
            await unzip(source, dest);
          }
        }
      }
    }
    catch (err) {
      console.error('Error unzipping files', err);
    }
  };

  const unzipBackupFile = async (zipFile) => {
    try {
      const source = APP_DIRECTORIES.BACKUP_DIR + zipFile;
      const target = APP_DIRECTORIES.BACKUP_DIR;

      await unzip(source, target);
      console.log('backup file unzipped successfully!');
      await deleteFromDevice(source);
      console.log('.zip file removed successfully!');
    }
    catch (err) {
      console.error('Error unzipping backup files', err);
    }
  };

  return {
    copyZipMapsToProject,
    loadProjectFromDevice,
    moveFiles,
    unzipBackupFile,
    unzipFile,
  };
};

export default useImport;
