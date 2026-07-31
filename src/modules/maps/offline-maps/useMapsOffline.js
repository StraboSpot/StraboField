import {unzip} from 'react-native-zip-archive';
import {useDispatch, useSelector} from 'react-redux';

import {checkIfZipStatusReady, getMedian, tile2lat, tile2long} from './offlineMaps.helpers';
import {addMapFromDevice, clearedMapsFromRedux, setOfflineMap} from './offlineMaps.slice';
import useDevice from '../../../services/device/useDevice';
import {APP_DIRECTORIES} from '../../../services/files/directories.constants';
import {STRABO_APIS} from '../../../services/network/urls.constants';
import useServerRequests from '../../../services/network/useServerRequests';
import {isEmpty} from '../../../shared/helpers';
import alert from '../../../shared/ui/alert';
import config from '../../../utils/config';
import {addedStatusMessage, removedLastStatusMessage} from '../../home/home.slice';
import {GLYPHS_URL} from '../glyphs/glyphs.constants';
import {DEFAULT_MAPS} from '../maps.constants';
import {setCurrentBasemap} from '../maps.slice';
import useMapURL from '../useMapURL';

let fileCount = 0;
let neededTiles = 0;
let notNeededTiles = 0;
let zipUID;

const useMapsOffline = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const customDatabaseEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const customMaps = useSelector(state => state.map.customMaps);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const user = useSelector(state => state.user);

  const {
    deleteFromDevice, doesDeviceDirExist, makeDirectory, moveFile, readDirectoryForMapFiles, readDirectoryForMapTiles,
  } = useDevice();
  const {buildStyleURL} = useMapURL();
  const {getTileBaseUrl, getTilesFromHost, zipURLStatus} = useServerRequests();

  /* Derived Variables */

  const source = currentBasemap && currentBasemap.source;
  const url = 'file://' + APP_DIRECTORIES.TILE_CACHE;

  /* Internal Functions */

  const adjustTileCount = async (files) => {
    console.log(`Adjusting Tile Count... ${files}`);
    for (const file of files) {
      if (offlineMaps[file]) {
        const tileCount = await readDirectoryForMapTiles(APP_DIRECTORIES.TILE_CACHE, file);
        if (offlineMaps[file].count !== tileCount.length) {
          const newOfflineMapCount = {...offlineMaps[file], count: tileCount.length};
          dispatch(setOfflineMap(newOfflineMapCount));
        }
      }
      else await addMapFromDeviceToRedux(file);
    }
  };

  const createOfflineMapObject = async (mapId, customMap) => {
    let tileCount = await readDirectoryForMapTiles(APP_DIRECTORIES.TILE_CACHE, mapId);
    tileCount = tileCount.length;

    const customMapData = !isEmpty(customMap) ? customMap[0] : undefined;

    let map = {
      id: mapId,
      name: offlineMaps[mapId]?.name ? offlineMaps[mapId].name : getMapNameFromId(mapId),
      count: tileCount,
      bbox: customMapData?.bbox || '',
      source: !mapId ? source : 'direct from filesystem',
      // Metadata carried so the map can be listed/categorized in the Map Layers menu regardless of the loaded project.
      // Note: `source` above must stay 'direct from filesystem' — buildStyleURL branches on it to build the offline tile path.
      customMapSource: customMapData?.source ?? offlineMaps[mapId]?.customMapSource,
      overlay: customMapData?.overlay ?? offlineMaps[mapId]?.overlay ?? false,
      mapId: zipUID,
      date: new Date().toLocaleString(),
      isOfflineMapVisible: false,
      version: 8,
      sources: {
        'raster-tiles': {
          type: 'raster',
          tiles: ['file://' + APP_DIRECTORIES.TILE_CACHE + mapId + '/tiles/{z}_{x}_{y}.png'],
          tileSize: 256,
        },
      },
      glyphs: GLYPHS_URL,
      layers: [{
        id: mapId,
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
      }],
    };
    console.log(map);
    return map;
  };

  const getMapNameFromId = (mapID) => {
    const mapObj = DEFAULT_MAPS.find(mapType => mapType.id === mapID);
    if (!mapObj) {
      const name = customMaps[mapID]?.title ? customMaps[mapID].title : mapID;
      return name;
    }
    return mapObj.title;
  };

  /* Exported Functions */

  const addMapFromDeviceToRedux = async (mapId) => {
    const map = await createOfflineMapObject(mapId);
    const mapSavedObject = Object.assign({}, {[map.id]: map});
    dispatch(addMapFromDevice(mapSavedObject));
  };

  const checkIfTileZipFolderExists = async () => {
    try {
      let folderExists = await doesDeviceDirExist(APP_DIRECTORIES.TILE_ZIP);
      console.log('Folder Exists:', folderExists ? 'YES' : 'NO');
      if (folderExists) {
        //delete
        await deleteFromDevice(APP_DIRECTORIES.TILE_ZIP, zipUID);
      }
      else await makeDirectory(APP_DIRECTORIES.TILE_ZIP);
    }
    catch (err) {
      console.error('Error checking if zip Tile Temp Directory exists', err);
    }
  };

  const checkTileZipFileExistence = async () => {
    try {
      let fileExists = await doesDeviceDirExist(APP_DIRECTORIES.TILE_ZIP + zipUID + '.zip');
      console.log('file Exists:', fileExists ? 'YES' : 'NO');
      if (fileExists) {
        //delete
        await deleteFromDevice(APP_DIRECTORIES.TILE_ZIP, zipUID + '.zip');
      }
    }
    catch (err) {
      console.error('Error checking if zip file exists', err);
    }
  };

  const checkZipStatus = async (zipId) => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        const status = await zipURLStatus(zipId);
        if (checkIfZipStatusReady(status)) {
          clearInterval(interval);
          resolve(status.status);
        }
      }, 1000);
      // Set a timeout to reject the promise if the condition isn't met in a certain time
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Condition not met in time'));
      }, 90000); // Timeout after 10 seconds
    }).catch((error) => {
      console.error('Error:', error);
      return Promise.reject(error);
    });
  };

  const doUnzip = async () => {
    try {
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Preparing to install tiles...'));
      const sourcePath = APP_DIRECTORIES.TILE_ZIP + zipUID + '.zip';
      await unzip(sourcePath, APP_DIRECTORIES.TILE_TEMP);
      console.log('unzip completed');
      console.log('move done.');
      await deleteFromDevice(APP_DIRECTORIES.TILE_ZIP, zipUID + '.zip');
      console.log('Zip', zipUID, 'has been deleted.');
    }
    catch (err) {
      console.error('Unzip Error:', err);
    }
  };

  const getMapCenterTile = async (mapid) => {
    if (APP_DIRECTORIES.ROOT_PATH) {
      const entries = await readDirectoryForMapTiles(APP_DIRECTORIES.TILE_CACHE, mapid);
      // loop over tiles to get center tiles
      let maxZoom = 0;
      let xvals = [];
      let yvals = [];

      entries.map((entry) => {
        const parts = entry.replace('.png', '').split('_');
        const z = Number(parts[0]);
        if (z > maxZoom) {
          maxZoom = z;
        }
      });
      if (maxZoom > 14) {
        maxZoom = 14;
      }

      entries.map((entry) => {
        const parts = entry.replace('.png', '').split('_');
        const z = Number(parts[0]);
        const x = Number(parts[1]);
        const y = Number(parts[2]);

        if (z === maxZoom) {
          if (xvals.indexOf(x) === -1) {
            xvals.push(x);
          }
          if (yvals.indexOf(y) === -1) {
            yvals.push(y);
          }
        }
      });

      let middleX = Math.floor(getMedian(xvals));
      let middleY = Math.floor(getMedian(yvals));

      let centerTile = maxZoom + '_' + middleX + '_' + middleY;
      const parts = centerTile.split('_');
      const z = Number(parts[0]);
      const x = Number(parts[1]);
      const y = Number(parts[2]);
      const lng = tile2long(x, z);
      const lat = tile2lat(y, z);
      return [lng, lat];
    }
  };

  // Start getting the tiles to download by creating a zip url
  const getMapTiles = async (extentString, downloadZoom) => {
    try {
      let layer, id, username;
      let startZipURL = 'unset';
      let mapKey = currentBasemap.id;
      const layerSource = currentBasemap.source;
      const tilehost = STRABO_APIS.TILE_HOST;
      const endpointTilehost = customDatabaseEndpoint.isSelected ? getTileBaseUrl() : tilehost;

      if (layerSource === 'map_warper' || layerSource === 'mapbox_styles' || layerSource === 'strabospot_mymaps') {
        //configure advanced URL for custom map types here.
        //first, figure out what kind of map we are downloading...

        let downloadMap = {};
        if (customMaps[mapKey].id === currentBasemap.id) downloadMap = customMaps[mapKey];

        console.log('DownloadMap: ', downloadMap);

        if (downloadMap.source === 'Mapbox Style' || downloadMap.source === 'mapbox_styles') {
          layer = 'mapboxstyles';
          const parts = downloadMap.id.split('/');
          username = parts[0];
          id = parts[1];
          const accessToken = user.mapboxToken && !isEmpty(user.mapboxToken) ? user.mapboxToken
            : config.get('mapbox_access_token');
          startZipURL = tilehost + '/asynczip?layer=' + layer + '&extent=' + extentString + '&zoom=' + downloadZoom
            + '&username=' + username + '&id=' + id + '&access_token=' + accessToken;
        }
        else if (downloadMap.source === 'strabospot_mymaps') {
          layer = 'strabomymaps';
          id = downloadMap.id;

          startZipURL = endpointTilehost + '/asynczip?layer=' + layer + '&extent=' + extentString + '&zoom=' + downloadZoom + '&id=' + id;
        }
      }
      else {
        layer = currentBasemap.id;
        startZipURL = endpointTilehost + '/asynczip?layer=' + layer + '&extent=' + extentString + '&zoom=' + downloadZoom;
      }

      console.log('startZipURL: ', startZipURL);
      return startZipURL;
    }
    catch (err) {
      console.error('Error Getting Map Tiles.', err);
      throw new Error(err);
    }
  };

  const getSavedMapsFromDevice = async () => {
    try {
      console.count('getSavedMapsFromDevice');
      const files = await readDirectoryForMapFiles();
      if (!isEmpty(files)) {
        await adjustTileCount(files);
        console.log('Done adjusting Tiles');
      }
      else dispatch(clearedMapsFromRedux());/**/
    }
    catch (err) {
      console.log('Error getting saved maps from device', err);
    }
  };

  const initializeSaveMap = async (extentString, downloadZoom) => {
    try {
      const startZipUrl = await getMapTiles(extentString, downloadZoom);
      await saveZipMap(startZipUrl);
      return zipUID;
    }
    catch (err) {
      console.error('Error Initializing Saving Map', err);
      throw Error(err);
    }
  };

  const moveFiles = async (zipUId) => {
    fileCount = 0;
    neededTiles = 0;
    notNeededTiles = 0;
    try {
      let result;
      let mapID = currentBasemap.id;
      if (currentBasemap.source === 'mapbox_styles') mapID = currentBasemap.id.split('/')[1];
      let folderExists = await doesDeviceDirExist(APP_DIRECTORIES.TILE_CACHE + mapID);
      if (!folderExists) {
        console.log('FOLDER DOESN\'T EXIST! ', APP_DIRECTORIES.TILE_CACHE + mapID);
        await makeDirectory(APP_DIRECTORIES.TILE_CACHE + mapID + '/tiles');
      }
      //now move files to correct location
      result = await readDirectoryForMapTiles(APP_DIRECTORIES.TILE_TEMP, zipUId);
      return result;
    }
    catch (err) {
      console.error('Error moving tiles', err);
      throw new Error(err);
    }
  };

  const moveTile = async (tile, zipID) => {
    let mapID = currentBasemap.id;
    if (currentBasemap.source === 'mapbox_styles') mapID = currentBasemap.id.split('/')[1];
    let zipId = zipUID ?? zipID;
    fileCount++;
    let fileExists = await doesDeviceDirExist(APP_DIRECTORIES.TILE_CACHE + mapID + '/tiles/' + tile);
    // console.log('foo exists: ', tile.name + ' ' + fileExists);
    if (!fileExists) {
      neededTiles++;
      await moveFile(APP_DIRECTORIES.TILE_TEMP + zipId + '/tiles/' + tile,
        APP_DIRECTORIES.TILE_CACHE + mapID + '/tiles/' + tile);
      console.log('Tile moved');
    }
    else notNeededTiles++;
    return [fileCount, neededTiles, notNeededTiles];
  };

  const saveZipMap = async (startZipURL) => {
    try {
      const tileJson = await getTilesFromHost(startZipURL);
      zipUID = tileJson.id;
      // if (zipUID) return;
    }
    catch (err) {
      console.error('Error in saveMapZip', err);
      throw new Error(err);
    }
  };

  const setOfflineMapTiles = async (map) => {
    console.log('Switch To Offline Map: ', map);
    const tilePath = '/tiles/{z}_{x}_{y}.png';
    const mapStyleURL = buildStyleURL({...map, tilePath: tilePath, url: [url]});
    console.log('tempCurrentBasemap: ', mapStyleURL);
    dispatch(setCurrentBasemap(mapStyleURL));
    // dispatch(setOfflineMapVisible(true));
    return mapStyleURL;
  };

  const switchToOfflineMap = async (mapId) => {
    if (!isEmpty(offlineMaps)) {
      const selectedOfflineMap = mapId ? offlineMaps[mapId] : offlineMaps[currentBasemap.id];
      if (selectedOfflineMap && selectedOfflineMap.count > 0) {
        console.log('SelectedOfflineMap', selectedOfflineMap);
        await setOfflineMapTiles(selectedOfflineMap);
      }
      else {
        const firstAvailableOfflineMap = Object.values(offlineMaps)[0];
        alert(
          'Not Available',
          'Selected map is not available for offline use.  '
          + `${firstAvailableOfflineMap.name} is available`, [
            {text: 'Use this map', onPress: () => setOfflineMapTiles(firstAvailableOfflineMap), style: 'destructive'},
          ]);
      }
    }
  };

  const updateMapTileCountWhenSaving = async (mapId) => {
    try {
      const mapID = mapId ? mapId : currentBasemap.id;
      const customMap = Object.values(customMaps).filter(map => mapID === map.id);
      console.log(customMap);
      const newOfflineMapsData = await createOfflineMapObject(mapID, customMap);
      console.log(newOfflineMapsData);
      dispatch(setOfflineMap(newOfflineMapsData));
      console.log('Map to save to Redux', newOfflineMapsData);
    }
    catch (err) {
      console.error('Error updating map object', err);
    }
  };

  return {
    addMapFromDeviceToRedux,
    checkIfTileZipFolderExists,
    checkTileZipFileExistence,
    checkZipStatus,
    doUnzip,
    getMapCenterTile,
    getMapTiles,
    getSavedMapsFromDevice,
    initializeSaveMap,
    moveFiles,
    moveTile,
    saveZipMap,
    setOfflineMapTiles,
    switchToOfflineMap,
    updateMapTileCountWhenSaving,
  };
};

export default useMapsOffline;
