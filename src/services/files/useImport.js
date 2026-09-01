import {subscribe, unzip} from 'react-native-zip-archive';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES} from './directories.constants';
import {clearLocalSaveNeeded} from '../../modules/connections/connections.slice';
import {
  addedStatusMessage,
  clearedStatusMessages,
  removedLastStatusMessage,
  resetMapImportProgress,
  setMapImportProgress,
} from '../../modules/home/home.slice';
import {stripMapboxTokenFromCustomMaps} from '../../modules/maps/custom-maps/customMaps.helpers';
import {addedCustomMapsFromBackup} from '../../modules/maps/maps.slice';
import {addedMapsFromDevice} from '../../modules/maps/offline-maps/offlineMaps.slice';
import {addedDatasets, addedProject, setActiveDatasets, setTargetDataset} from '../../modules/project/projects.slice';
import {addedSpotsFromDevice} from '../../modules/spots/spots.slice';
import {isEmpty} from '../../shared/helpers';
import {persistor} from '../../store/ConfigureStore';
import useResetState from '../../store/useResetState';
import useDevice from '../device/useDevice';

let fileCount = 0;
let isOldBackup;
let mapFailures = 0;
let neededTiles = 0;
let notNeededTiles = 0;
let movedTiles = 0;
let totalTilesToMove = 0;

const useImport = () => {
  /* Data Hooks */

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
    readFile,
  } = useDevice();
  const {clearProject} = useResetState();

  /* Internal Functions */

  const checkForMaps = async (dataFile, selectedProject, isExternal) => {
    let progress;
    fileCount = 0;
    neededTiles = 0;
    notNeededTiles = 0;
    mapFailures = 0;
    movedTiles = 0;
    totalTilesToMove = 0;
    dispatch(resetMapImportProgress());
    const {mapNamesDb, otherMapsDb} = dataFile;
    dispatch(addedStatusMessage('Checking for maps to import...'));
    if (!isEmpty(otherMapsDb)) {
      dispatch(removedLastStatusMessage());
      dispatch(addedCustomMapsFromBackup(stripMapboxTokenFromCustomMaps(otherMapsDb)));
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
      dispatch(addedStatusMessage(`Map tiles imported: ${progress?.fileCount || 0}`));
      dispatch(addedStatusMessage(`Map tiles installed: ${progress?.neededTiles || 0}`));
      dispatch(addedStatusMessage(`Map tiles already installed: ${progress?.notNeededTiles || 0}`));
      if (progress?.mapFailures) dispatch(addedStatusMessage(`Map tiles skipped: ${progress.mapFailures}`));
      dispatch(addedStatusMessage('Finished moving tiles'));
      dispatch(resetMapImportProgress());
    }
    else {
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('No maps to import.'));
    }
  };

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
        console.log('Image Files in Backup:', imageFiles);
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

  // Bound a native filesystem call so a single one that never settles can't freeze the whole import.
  const withTimeout = (promise, ms, label) => {
    let timer;
    const timeout = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms: ${label}`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  };

  const moveTile = async (tile, id, tileFolder) => {
    const dest = APP_DIRECTORIES.TILE_CACHE + tileFolder + '/tiles/' + tile;
    try {
      const fileExists = await withTimeout(doesDeviceDirExist(dest), 15000, 'exists ' + tile);
      if (!fileExists) {
        await withTimeout(
          moveFile(APP_DIRECTORIES.TILE_TEMP + id + '/tiles/' + tile, dest), 15000, 'move ' + tile);
        neededTiles++;
      }
      else {
        notNeededTiles++;
      }
    }
    catch (err) {
      // A timed-out or failed tile is skipped rather than allowed to stall the import; it surfaces in the
      // 'Map tiles imported' vs 'installed' totals shown when the import finishes.
      mapFailures++;
      console.warn('Skipped tile:', tile, err?.message);
    }
    finally {
      fileCount++;
      movedTiles++;
    }
  };

  /* Exported Functions */

  const copyZipMapsToProject = async (fileName, isExternal) => {
    // Reflect the native unzip's progress on the bar. subscribe fires many events per file, so only push
    // when the whole-number percent changes to keep re-renders down.
    let lastPct = -1;
    const unzipSubscription = subscribe(({progress}) => {
      const pct = Math.round(progress * 100);
      if (pct !== lastPct) {
        lastPct = pct;
        dispatch(setMapImportProgress({progress, label: 'Unzipping map tiles...'}));
      }
    });
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
    finally {
      unzipSubscription.remove();
    }
  };

  const loadProjectData = async (dataFile) => {
    if (!isEmpty(project)) await persistor.purge();
    const {projectDb, spotsDb} = dataFile;
    if (!isEmpty(project.id)) clearProject();
    dispatch(addedSpotsFromDevice(spotsDb));
    dispatch(addedProject(projectDb.project || projectDb));
    dispatch(addedDatasets(projectDb.datasets));
    if (Object.values(projectDb.datasets).length > 0 && !isEmpty(Object.values(projectDb.datasets)[0])) {
      dispatch(setActiveDatasets({bool: true, dataset: Object.values(projectDb.datasets)[0].id}));
      dispatch(setTargetDataset(Object.values(projectDb.datasets)[0].id));
    }
    dispatch(clearLocalSaveNeeded());
    return projectDb.project;
  };

  const loadProjectFromDevice = async (selectedProject, isExternal) => {
    dispatch(clearedStatusMessages());
    dispatch(addedStatusMessage(`Importing ${selectedProject}...`));
    console.log('SELECTED PROJECT', selectedProject);

    // Auto save: flat JSON file in AutoBackups/
    if (selectedProject.endsWith('.json')) {
      const fileContent = await readFile(APP_DIRECTORIES.BACKUP_DIR + selectedProject);
      if (!fileContent) throw new Error('Auto-backup file not found: ' + selectedProject);
      const loadedProject = await loadProjectData(JSON.parse(fileContent));
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Project loaded.'));
      dispatch(addedStatusMessage('Complete!'));
      return {project: loadedProject};
    }

    // Manual save: directory containing data.json, optionally zipped
    if (selectedProject.includes('.zip')) {
      await unzipBackupFile(selectedProject);
      selectedProject = selectedProject.replace('.zip', '');
    }
    const dirExists = await doesDeviceBackupDirExist(selectedProject);
    if (dirExists) {
      const dataFile = await readDeviceJSONFile(selectedProject);
      if (!dataFile) throw new Error('Project data file (data.json) not found in ' + selectedProject);
      const loadedProject = await loadProjectData(dataFile);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage(`${selectedProject}\nProject loaded.`));
      dispatch(addedStatusMessage('Importing image files...'));
      await copyImages(selectedProject);
      await checkForMaps(dataFile, selectedProject, isExternal);
      dispatch(addedStatusMessage('Complete!'));
      return {project: loadedProject};
    }
  };

  const moveFiles = async (dataFile) => {
    try {
      console.log('Offline Maps in Backup:', dataFile.mapNamesDb);
      // First pass: resolve each map's tiles so we know the total up front, which the ProgressBar needs as its
      // denominator. Done sequentially (rather than in the move loop) so every map gets its own tile list.
      const movePlan = [];
      for (const map of Object.values(dataFile.mapNamesDb)) {
        // Mapbox Styles map ids arrive as 'username/styleId', but tiles are cached (and zipped) under the
        // styleId only (see getTileFolderName), so strip the account prefix before locating/moving them.
        // Without this the '/' is treated as a subfolder and no matching tiles are found.
        const tileFolder = map.id.includes('/') ? map.id.split('/').pop() : map.id;
        const checkSuccess = await doesDeviceDirectoryExist(APP_DIRECTORIES.TILE_CACHE + tileFolder + '/tiles/');
        if (checkSuccess) {
          console.log(tileFolder + ': Tiles directory exists.');
          const files = await readDirectory(APP_DIRECTORIES.TILE_TEMP) || [];
          const mapId = files.find(id => id === tileFolder);
          const zipID = files.find(zipId => zipId === map.mapId);
          const id = isOldBackup ? zipID : mapId;
          if (id) {
            const tileArray = await readDirectory(APP_DIRECTORIES.TILE_TEMP + id + '/tiles');
            movePlan.push({tileArray, id, tileFolder});
          }
          else {
            mapFailures++;
            console.log(tileFolder + ': Map file not found. Failures:', mapFailures);
          }
        }
      }
      // Flatten to one task list and move in bounded batches. A single Promise.all over every tile fires
      // thousands of native file ops at once, which swamps the filesystem bridge so nothing resolves until the
      // very end — the bar sits at 0% and looks frozen. Batching keeps native fed and advances the bar steadily.
      const tileTasks = movePlan.flatMap(
        ({tileArray, id, tileFolder}) => tileArray.map(tile => ({tile, id, tileFolder})));
      totalTilesToMove = tileTasks.length;
      dispatch(setMapImportProgress({progress: 0, label: `Moving map tiles (0/${totalTilesToMove})`}));
      const BATCH_SIZE = 10;
      for (let i = 0; i < tileTasks.length; i += BATCH_SIZE) {
        const batch = tileTasks.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(({tile, id, tileFolder}) => moveTile(tile, id, tileFolder)));
        dispatch(setMapImportProgress({
          progress: totalTilesToMove ? movedTiles / totalTilesToMove : 0,
          label: `Moving map tiles (${movedTiles}/${totalTilesToMove})`,
        }));
      }
      console.log('Move Files Promise Complete!!!');
      return {fileCount: fileCount, neededTiles: neededTiles, notNeededTiles: notNeededTiles, mapFailures: mapFailures};
    }
    catch (err) {
      console.error('Error in moveFiles()', err);
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

  const unzipFile = async (filePath) => {
    try {
      const checkDirSuccess = await doesDeviceDirectoryExist(APP_DIRECTORIES.TILE_TEMP);
      console.log('Tile Temp Directory Exists:', checkDirSuccess);
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

  return {
    copyZipMapsToProject,
    loadProjectFromDevice,
    moveFiles,
    unzipBackupFile,
    unzipFile,
  };
};

export default useImport;
