import {unzip} from 'react-native-zip-archive';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES} from './directories.constants';
import useDeviceHook from './useDevice';
import {
  addedStatusMessage,
  clearedStatusMessages,
  removedLastStatusMessage,
  setLoadingStatus,
} from '../modules/home/home.slice';
import {addedCustomMapsFromBackup, clearedMaps} from '../modules/maps/maps.slice';
import {addedMapsFromDevice} from '../modules/maps/offline-maps/offlineMaps.slice';
import {
  addedDatasets,
  addedProject,
  clearedDatasets,
  setActiveDatasets,
  setSelectedDataset,
  setSelectedProject,
} from '../modules/project/projects.slice';
import {addedSpotsFromDevice, clearedSpots} from '../modules/spots/spots.slice';
import {isEmpty} from '../shared/Helpers';

const useImport = () => {
  let isOldBackup;
  let fileCount = 0;
  let neededTiles = 0;
  let notNeededTiles = 0;
  let mapFailures = 0;

  const dispatch = useDispatch();
  const project = useSelector(state => state.project.project);

  const useDevice = useDeviceHook();

  const copyImages = async (fileName) => {
    try {
      const existsWithLowercase = await useDevice.doesDeviceDirExist(APP_DIRECTORIES.BACKUP_DIR
        + fileName + '/images');
      const existsWithCapital = await useDevice.doesDeviceDirExist(APP_DIRECTORIES.BACKUP_DIR
        + fileName + '/Images');
      const imagesFolderName = existsWithLowercase ? '/images' : '/Images';
      if (existsWithCapital || existsWithLowercase) {
        const imageFiles = await useDevice.readDirectory(APP_DIRECTORIES.BACKUP_DIR
          + fileName + imagesFolderName);
        console.log(imageFiles);
        await useDevice.doesDeviceDirectoryExist(APP_DIRECTORIES.IMAGES);
        if (!isEmpty(imageFiles)) {
          imageFiles.map(async (image) => {
            await useDevice.copyFiles(APP_DIRECTORIES.BACKUP_DIR
              + fileName + imagesFolderName + '/' + image, APP_DIRECTORIES.IMAGES + image);
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
      const checkDirSuccess = await useDevice.doesDeviceBackupDirExist(fileName + '/maps');
      console.log('Found map zips folder', checkDirSuccess);
      if (checkDirSuccess) {
        await useDevice.doesDeviceDirectoryExist(APP_DIRECTORIES.APP_DIR);
        await useDevice.doesDeviceDirectoryExist(APP_DIRECTORIES.TILE_ZIP);
        let zipFiles = await useDevice.readDirectory(sourceDir + fileName + '/maps');
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
      dispatch(addedStatusMessage(`Map tiles imported: ${progress.fileCount}`));
      dispatch(addedStatusMessage(`Map tiles installed: ${progress.neededTiles}`));
      dispatch(addedStatusMessage(`Map tiles already installed: ${progress.notNeededTiles}`));
      dispatch(addedStatusMessage('Finished moving tiles'));
    }
    else {
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('No maps to import.'));
    }
  };

  const destroyOldProject = () => {
    dispatch(clearedSpots());
    dispatch(clearedDatasets());
    dispatch(clearedMaps());
    console.log('Destroy complete');
  };

  const loadProjectFromDevice = async (selectedProject, isExternal) => {
    dispatch(clearedStatusMessages());
    dispatch(setLoadingStatus({view: 'modal', bool: true}));
    dispatch(addedStatusMessage(`Importing ${selectedProject}...`));

    console.log('SELECTED PROJECT', selectedProject);
    if (selectedProject.includes('.zip')) {
      await unzipBackupFile(selectedProject);
      selectedProject = selectedProject.replace('.zip', '');
    }
    const dirExists = await useDevice.doesDeviceBackupDirExist(selectedProject);
    if (dirExists) {
      const dataFile = await useDevice.readDeviceJSONFile(selectedProject);
      if (!isEmpty(project) && dataFile) destroyOldProject();
      const {projectDb, spotsDb} = dataFile;
      console.log('DataFile', dataFile);
      dispatch(addedSpotsFromDevice(spotsDb));
      dispatch(addedProject(projectDb.project || projectDb));
      dispatch(addedDatasets(projectDb.datasets));
      if (Object.values(projectDb.datasets).length > 0 && !isEmpty(Object.values(projectDb.datasets)[0])) {
        dispatch(setActiveDatasets({bool: true, dataset: Object.values(projectDb.datasets)[0].id}));
        dispatch(setSelectedDataset(Object.values(projectDb.datasets)[0].id));
      }
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage(`${selectedProject}\nProject loaded.`));
      dispatch(addedStatusMessage('Importing image files...'));
      await copyImages(selectedProject);
      await checkForMaps(dataFile, selectedProject, isExternal);
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      dispatch(setSelectedProject({project: '', source: ''}));
      return Promise.resolve({project: dataFile.projectDb.project});
    }
  };

  const moveFiles = async (dataFile) => {
    try {
      let fileEntries = [];
      console.log(dataFile.mapNamesDb);
      await Promise.all(
        Object.values(dataFile.mapNamesDb).map(async (map) => {
          const checkSuccess = await useDevice.doesDeviceDirectoryExist(
            APP_DIRECTORIES.TILE_CACHE + map.id + '/tiles/');
          if (checkSuccess) {
            console.log('dir exists');
            const files = await useDevice.readDirectory(APP_DIRECTORIES.TILE_TEMP);
            const mapId = files.find(id => id === map.id);
            const zipID = files.find(zipId => zipId === map.mapId);
            const id = isOldBackup ? zipID : mapId;
            if (id) fileEntries = await useDevice.readDirectory(APP_DIRECTORIES.TILE_TEMP + id + '/tiles');
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
        const fileExists = await useDevice.doesDeviceDirExist(APP_DIRECTORIES.TILE_CACHE + map.id + '/tiles/' + tile);
        if (!fileExists) {
          await useDevice.moveFile(
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
      const checkDirSuccess = await useDevice.doesDeviceDirectoryExist(APP_DIRECTORIES.TILE_TEMP);
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
      await useDevice.deleteFromDevice(source);
      console.log('.zip file removed successfully!');
    }
    catch (err) {
      console.error('Error unzipping backup files', err);
    }
  };

  return {
    copyZipMapsToProject: copyZipMapsToProject,
    loadProjectFromDevice: loadProjectFromDevice,
    moveFiles: moveFiles,
    unzipBackupFile: unzipBackupFile,
    unzipFile: unzipFile,
  };
};

export default useImport;
