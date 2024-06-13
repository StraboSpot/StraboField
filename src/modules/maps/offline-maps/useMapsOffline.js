import {unzip} from 'react-native-zip-archive';
import {useDispatch, useSelector} from 'react-redux';

import {addMapFromDevice, clearedMapsFromRedux, setOfflineMap} from './offlineMaps.slice';
import {APP_DIRECTORIES} from '../../../services/directories.constants';
import {STRABO_APIS} from '../../../services/urls.constants';
import useDeviceHook from '../../../services/useDevice';
import useServerRequestsHook from '../../../services/useServerRequests';
import {isEmpty} from '../../../shared/Helpers';
import alert from '../../../shared/ui/alert';
import config from '../../../utils/config';
import {addedStatusMessage, removedLastStatusMessage} from '../../home/home.slice';
import {DEFAULT_MAPS} from '../maps.constants';
import {setCurrentBasemap} from '../maps.slice';
import useMapURLHook from '../useMapURL';

const useMapsOffline = () => {
  let zipUID;
  let fileCount = 0;
  let neededTiles = 0;
  let notNeededTiles = 0;

  const dispatch = useDispatch();
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const customMaps = useSelector(state => state.map.customMaps);
  const customDatabaseEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const user = useSelector(state => state.user);

  const source = currentBasemap && currentBasemap.source;
  const url = 'file://' + APP_DIRECTORIES.TILE_CACHE;

  const useDevice = useDeviceHook();
  const useMapURL = useMapURLHook();
  const useServerRequests = useServerRequestsHook();

  //INTERNAL
  const adjustTileCount = async () => {
    Object.values(offlineMaps).map(async (map) => {
      const tileCount = await useDevice.readDirectoryForMapTiles(APP_DIRECTORIES.TILE_CACHE, map.id);
      // if (!isEmpty(tileCount)) {
      const tileCountLength = tileCount.length;
      // if (map.count !== tileCountLength) {
      const newOfflineMapCount = {...offlineMaps[map.id], count: tileCountLength};
      console.log('newOfflineMapCount', newOfflineMapCount);
      dispatch(setOfflineMap(newOfflineMapCount));
    });
  };

  const addMapFromDeviceToRedux = async (mapId) => {
    const map = await createOfflineMapObject(mapId);
    const mapSavedObject = Object.assign({}, {[map.id]: map});
    dispatch(addMapFromDevice(mapSavedObject));
  };

  const checkIfTileZipFolderExists = async () => {
    try {
      let folderExists = await useDevice.doesDeviceDirExist(APP_DIRECTORIES.TILE_ZIP);
      console.log('Folder Exists:', folderExists ? 'YES' : 'NO');
      if (folderExists) {
        //delete
        await useDevice.deleteFromDevice(APP_DIRECTORIES.TILE_ZIP, zipUID);
      }
      else await useDevice.makeDirectory(APP_DIRECTORIES.TILE_ZIP);
    }
    catch (err) {
      console.error('Error checking if zip Tile Temp Directory exists', err);
    }
  };

  const checkTileZipFileExistence = async () => {
    try {
      let fileExists = await useDevice.doesDeviceDirExist(APP_DIRECTORIES.TILE_ZIP + zipUID + '.zip');
      console.log('file Exists:', fileExists ? 'YES' : 'NO');
      if (fileExists) {
        //delete
        await useDevice.deleteFromDevice(APP_DIRECTORIES.TILE_ZIP, zipUID + '.zip');
      }
    }
    catch (err) {
      console.error('Error checking if zip file exists', err);
    }
  };

  const checkZipStatus = async (zipId) => {
    // try {
    const status = await useServerRequests.zipURLStatus(zipId);
    if (status.status === 'Invalid Map Specified') {
      throw Error(status.status);
    }
    else if (status.status !== 'Zip File Ready.') await checkZipStatus(zipId);
    // }
    // catch (err) {
    //   console.error('Error checking zip status', err);
    //   throw new Error(err);
    // }
  };

  const createOfflineMapObject = async (mapId, customMap) => {
    let tileCount = await useDevice.readDirectoryForMapTiles(APP_DIRECTORIES.TILE_CACHE, mapId);
    tileCount = tileCount.length;

    let map = {
      id: mapId,
      name: offlineMaps[mapId]?.name ? offlineMaps[mapId].name : getMapNameFromId(mapId),
      count: tileCount,
      bbox: !isEmpty(customMap) ? customMap[0]?.bbox : '',
      source: !mapId ? source : 'direct from filesystem',
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
      glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
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

  const doUnzip = async () => {
    try {
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Preparing to install tiles...'));
      const sourcePath = APP_DIRECTORIES.TILE_ZIP + zipUID + '.zip';
      await unzip(sourcePath, APP_DIRECTORIES.TILE_TEMP);
      console.log('unzip completed');
      console.log('move done.');
      await useDevice.deleteFromDevice(APP_DIRECTORIES.TILE_ZIP, zipUID + '.zip');
      console.log('Zip', zipUID, 'has been deleted.');
    }
    catch (err) {
      console.error('Unzip Error:', err);
    }
  };

  const getMapCenterTile = async (mapid) => {
    if (APP_DIRECTORIES.ROOT_PATH) {
      const entries = await useDevice.readDirectoryForMapTiles(APP_DIRECTORIES.TILE_CACHE, mapid);
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

  const getMapNameFromId = (mapID) => {
    const mapObj = DEFAULT_MAPS.find(mapType => mapType.id === mapID);
    if (!mapObj) {
      const name = customMaps[mapID]?.title ? customMaps[mapID].title : mapID;
      return name;
    }
    return mapObj.title;
  };

  // Start getting the tiles to download by creating a zip url
  const getMapTiles = async (extentString, downloadZoom) => {
    try {
      let layer, id, username;
      let startZipURL = 'unset';
      let mapKey = currentBasemap.id;
      const layerSource = currentBasemap.source;
      const tilehost = STRABO_APIS.TILE_HOST;
      const endpointTilehost = customDatabaseEndpoint.isSelected ? useServerRequests.getTilehostUrl() : tilehost;

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
        else if (downloadMap.source === 'Map Warper' || downloadMap.source === 'map_warper') {
          layer = 'mapwarper';
          id = downloadMap.id;
          startZipURL = tilehost + '/asynczip?layer=' + layer + '&extent=' + extentString + '&zoom=' + downloadZoom + '&id=' + id;
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

  const getMedian = (arr) => {
    arr = arr.slice(0); // create copy
    const middle = (arr.length + 1) / 2,
      sorted = arr.sort(function (a, b) {
        return a - b;
      });
    return (sorted.length % 2) ? sorted[middle - 1] : (sorted[middle - 1.5] + sorted[middle - 0.5]) / 2;
  };

  const getSavedMapsFromDevice = async () => {
    try {
      const files = await useDevice.readDirectoryForMapFiles();
      if (!isEmpty(files)) {
        files.map(async (file) => {
          if (offlineMaps[file]) {
            await adjustTileCount(file);
            console.log('Tiles Adjusted');
          }
          else {
            console.log(`Map ${file} not there`);
            await addMapFromDeviceToRedux(file);
          }
        });
      }
      else dispatch(clearedMapsFromRedux());
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
    try {
      let result;
      let mapID = currentBasemap.id;
      if (currentBasemap.source === 'mapbox_styles') mapID = currentBasemap.id.split('/')[1];
      let folderExists = await useDevice.doesDeviceDirExist(APP_DIRECTORIES.TILE_CACHE + mapID);
      if (!folderExists) {
        console.log('FOLDER DOESN\'T EXIST! ', APP_DIRECTORIES.TILE_CACHE + mapID);
        await useDevice.makeDirectory(APP_DIRECTORIES.TILE_CACHE + mapID + '/tiles');
      }
      //now move files to correct location
      result = await useDevice.readDirectoryForMapTiles(APP_DIRECTORIES.TILE_TEMP, zipUId);
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
    let fileExists = await useDevice.doesDeviceDirExist(APP_DIRECTORIES.TILE_CACHE + mapID + '/tiles/' + tile);
    // console.log('foo exists: ', tile.name + ' ' + fileExists);
    if (!fileExists) {
      neededTiles++;
      await useDevice.moveFile(APP_DIRECTORIES.TILE_TEMP + zipId + '/tiles/' + tile,
        APP_DIRECTORIES.TILE_CACHE + mapID + '/tiles/' + tile);
      console.log('Tile moved');
    }
    else notNeededTiles++;
    return [fileCount, neededTiles, notNeededTiles];
  };

  const saveZipMap = async (startZipURL) => {
    try {
      const tileJson = await useServerRequests.getMapTilesFromHost(startZipURL);
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
    const mapStyleURL = useMapURL.buildStyleURL({...map, tilePath: tilePath, url: [url]});
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

  // borrowed from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
  const tile2long = (x, z) => {
    return (x / Math.pow(2, z) * 360 - 180);
  };

  // borrowed from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
  const tile2lat = (y, z) => {
    const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
  };

  const updateMapTileCountWhenSaving = async (mapId) => {
    try {
      const mapID = mapId ? mapId : currentBasemap.id;
      const customMap = Object.values(customMaps).filter(map => mapID === map.id);
      console.log(customMap);
      const newOfflineMapsData = await createOfflineMapObject(mapID, customMap);
      console.log(newOfflineMapsData);
      await dispatch(setOfflineMap(newOfflineMapsData));
      console.log('Map to save to Redux', newOfflineMapsData);
    }
    catch (err) {
      console.error('Error updating map object', err);
    }
  };

  return {
    addMapFromDeviceToRedux: addMapFromDeviceToRedux,
    checkIfTileZipFolderExists: checkIfTileZipFolderExists,
    checkTileZipFileExistence: checkTileZipFileExistence,
    checkZipStatus: checkZipStatus,
    doUnzip: doUnzip,
    getMapCenterTile: getMapCenterTile,
    getMapTiles: getMapTiles,
    getSavedMapsFromDevice: getSavedMapsFromDevice,
    initializeSaveMap: initializeSaveMap,
    moveFiles: moveFiles,
    moveTile: moveTile,
    saveZipMap: saveZipMap,
    setOfflineMapTiles: setOfflineMapTiles,
    switchToOfflineMap: switchToOfflineMap,
    updateMapTileCountWhenSaving: updateMapTileCountWhenSaving,
  };
};

export default useMapsOffline;
