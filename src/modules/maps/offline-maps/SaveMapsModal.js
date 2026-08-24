import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import {Picker} from '@react-native-picker/picker';
import ProgressBar from 'react-native-progress/Bar';
import {useDispatch, useSelector} from 'react-redux';

import {calculateScaleRatio} from './scale';
import useMapsOffline from './useMapsOffline';
import useDevice from '../../../services/device/useDevice';
import {APP_DIRECTORIES} from '../../../services/files/directories.constants';
import useServerRequests from '../../../services/network/useServerRequests';
import {toNumberFixedValue} from '../../../shared/helpers';
import * as themes from '../../../shared/styles.constants';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import {
  addedStatusMessage,
  clearedStatusMessages,
  removedLastStatusMessage,
  setIsOfflineMapsModalVisible,
} from '../../home/home.slice';
import {MAP_PROVIDERS} from '../maps.constants';

const SaveMapsModal = ({getCurrentZoom, getExtentString, getTileCount}) => {
  // console.log('Rendering SaveMapsModal...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const {endpoint, isSelected} = useSelector(state => state.connections.databaseEndpoint);
  const statusMessages = useSelector(state => state.home.statusMessages);

  const {doesDeviceDirectoryExist, downloadAndSaveMap} = useDevice();
  const {
    checkTileZipFileExistence,
    checkZipStatus,
    doUnzip,
    initializeSaveMap,
    moveFiles,
    moveTile,
    updateMapTileCountWhenSaving,
  } = useMapsOffline();
  const {getTileBaseUrl} = useServerRequests();

  /* Local State */

  const [downloadZoom, setDownloadZoom] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [extentString, setExtentString] = useState('');
  const [installedTiles, setInstalledTiles] = useState(0);
  const [isError, setIsError] = useState(false);
  const [isLoadingCircle, setIsLoadingCircle] = useState(false);
  const [isLoadingWave, setIsLoadingWave] = useState(false);
  const [percentDone, setPercentDone] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [showLoadingBar, setShowLoadingBar] = useState(false);
  const [showLoadingMenu, setShowLoadingMenu] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [tileCount, setTileCount] = useState(0);
  const [tilesToInstall, setTilesToInstall] = useState(0);
  const [zoomLevels, setZoomLevels] = useState([]);

  /* Derived Variables */

  const currentMapName = currentBasemap && currentBasemap.title;
  const maxZoom = MAP_PROVIDERS[currentBasemap.source]?.maxZoom;

  /* Side Effects */

  useEffect(() => {
    console.log('UE SaveMapsModal []');
    return function cleanUp() {
      console.log('UE CLEANUP SaveMapsModal');
      setInstalledTiles(0);
      setTilesToInstall(0);
      setPercentDone(0);
    };
  }, []);

  useEffect(() => {
    console.log('UE SaveMapsModal [getCurrentZoom]');
    if (getCurrentZoom) {
      getCurrentZoom().then((zoom) => {
        let initialZoom = [];
        let currentZoom = Math.round(zoom);
        setDownloadZoom(Math.round(zoom));
        const numZoomLevels = maxZoom ? Math.min(maxZoom - currentZoom + 1, 6) : 5;
        for (let i = 0; i < numZoomLevels; i++) {
          initialZoom.push(currentZoom + i);
        }
        setZoomLevels(initialZoom);
      });
      getExtentString().then((ex) => {
        console.log('Extent String', ex);
        setExtentString(ex);
      });
    }
  }, [getCurrentZoom]);

  useEffect(() => {
    console.log('UE SaveMapsModal [downloadZoom]', downloadZoom);
    console.log('extentString is UE', extentString);
    shouldDownload().catch(err => console.error('Error in SaveMapsModal shouldDownload()', err));
  }, [downloadZoom]);

  /* Logic Helpers */

  const downloadZip = async (zipUID) => {
    try {
      const tilehost = getTileBaseUrl();
      const downloadZipURL = tilehost + '/ziptemp/' + zipUID + '/' + zipUID + '.zip';
      const downloadOptions = {
        fromUrl: downloadZipURL,
        toFile: APP_DIRECTORIES.TILE_ZIP + zipUID + '.zip',
        begin: (response) => {
          const jobId = response.jobId;
          setShowLoadingBar(true);
          setIsLoadingWave(false);
          dispatch(removedLastStatusMessage());
          dispatch(addedStatusMessage('Downloading...'));
          console.log('DOWNLOAD HAS BEGUN! JobId: ' + jobId);
        },
        progress: (res) => {
          console.log('Download Zip Progress', ((res.bytesWritten / res.contentLength) * 100).toFixed(2));
          setPercentDone(res.bytesWritten / res.contentLength);
        },
        discretionary: true,
      };

      //first try to delete from temp directories
      await doesDeviceDirectoryExist(APP_DIRECTORIES.TILE_ZIP);
      await doesDeviceDirectoryExist(APP_DIRECTORIES.TILE_TEMP);
      await checkTileZipFileExistence();
      await downloadAndSaveMap(downloadOptions);
      await unzip(zipUID);
    }
    catch (err) {
      console.error('Server error in downloadZipUrl', err);
      throw err;
    }
  };

  const getScale = (z) => {
    try {
      const [minX, minY, maxX, maxY] = extentString.split(',');
      const lat = (parseFloat(minY) + parseFloat(maxY)) / 2;   // Get the latitude of the center of extent
      const scaleN = calculateScaleRatio(lat, z);
      return '   (1:' + scaleN.toLocaleString() + ')';
    }
    catch (err) {
      console.error('Error finding scale', err);
      return '';
    }
  };

  const saveMap = async () => {
    try {
      setShowMainMenu(false);
      setShowLoadingMenu(true);
      setShowLoadingBar(true);
      setIsLoadingWave(true);
      setIsLoadingCircle(false);
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Gathering Tiles...'));
      const zipId = await initializeSaveMap(extentString, downloadZoom);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Preparing Data...'));
      await checkZipStatus(zipId);
      setShowLoadingBar(false);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Data ready to download.'));
      await downloadZip(zipId);
      const tileArray = await moveFiles(zipId);
      await tileMove(tileArray, zipId);
      await updateMapTileCountWhenSaving();
      console.log('Saved offlineMaps to Redux.');
      setShowMainMenu(false);
      setShowLoadingMenu(false);
      setShowLoadingBar(false);
      setShowComplete(true);
    }
    catch (err) {
      console.error('Error saving map', err);
      const editedError = err.toString().replace('Error: Error: Error:', '');
      setIsError(true);
      setErrorMessage(
        `${editedError}!\n\n Make sure you are pulling the map from the correct endpoint\n(Home Menu -> Advanced Options -> Custom Database Endpoint).`);
      setShowMainMenu(false);
      setShowLoadingMenu(false);
      setShowLoadingBar(false);
      setIsLoadingCircle(false);
    }
  };

  const shouldDownload = async () => {
    if (downloadZoom > 0) {
      setIsLoadingCircle(true);
      updateCount().then(() => {
        console.log('TileCount', tileCount);
      });
    }
  };

  const tileMove = async (tilearray) => {
    setIsLoadingWave(false);
    dispatch(removedLastStatusMessage());
    dispatch(addedStatusMessage('Installing tiles...'));
    for (const tile of tilearray) {
      const progress = await moveTile(tile);
      setPercentDone(progress[0] / tilearray.length);
      setInstalledTiles(progress[2]);
      setTilesToInstall(progress[1]);
    }
  };

  const unzip = async () => {
    try {
      setIsLoadingWave(true);
      setPercentDone(0);
      await doUnzip();
    }
    catch (err) {
      console.error('Unzip Error:', err);
    }
  };

  const updateCount = async () => {
    const tc = await getTileCount(downloadZoom);
    if (tc?.count) {
      console.log('downloadZoom from updateCount: ', downloadZoom);
      console.log('downloadZoom tc: ', tc.count);
      setTileCount(tc.count);
      setIsLoadingCircle(false);
      console.log('return_from_mapview_getTileCount: ', tc.count);
    }
      // No count means the tile-count service failed or returned a message. Show it inline in this modal
    // rather than closing this modal and opening the global MessageModal (which iOS drops mid-handoff).
    else {
      setShowMainMenu(false);
      if (tc?.message?.includes('Invalid extent')) {
        console.error(tc.message);
        setErrorMessage('\n\nPlease zoom to level 5 or greater to get a more accurate tiles with features.');
      }
      else if (tc?.message) setErrorMessage(tc.message);
      setIsError(true);
      setIsLoadingCircle(false);
    }
  };

  const updatePicker = async zoomValue => setDownloadZoom(zoomValue);

  /* View */

  return (
    <ModalWrapper
      actionTitle={`Download ${tileCount} Tiles`}
      cancelTitle={showMainMenu ? 'Cancel' : 'Close'}
      headerTitle={currentMapName}
      onActionPressed={saveMap}
      onCancelPress={() => dispatch(setIsOfflineMapsModalVisible(false))}
      overlayStyleOverride={{height: 'auto'}}
      showActionButton={showMainMenu}
      showCancelButton={showMainMenu || showComplete || isError}
    >
      <View style={overlayStyles.contentText}>
        <View>
          <View style={{}}>
            {showMainMenu && (
              <View>
                <Text style={overlayStyles.contentText}>
                  Select max zoom level to download:
                </Text>
                <Picker
                  itemStyle={{color: themes.BLACK}}
                  mode={'dropdown'}
                  onValueChange={value => updatePicker(value)}
                  prompt={'Select a zoom level'}
                  selectedValue={downloadZoom}
                >
                  {zoomLevels.map((zoom) => {
                    return (
                      <Picker.Item
                        key={zoom}
                        label={zoom.toString() + getScale(zoom)}
                        style={{width: 100}}
                        value={zoom}
                      />
                    );
                  })}
                </Picker>
              </View>
            )}
            {showLoadingBar && (
              <View style={overlayStyles.overlayContent}>
                {isLoadingWave
                  ? (
                    <ActivityIndicator color={themes.BLACK} size={'large'}/>
                  ) : (
                    <View>
                      <ProgressBar progress={percentDone} width={200}/>
                      <Text style={overlayStyles.statusMessageText}>
                        {toNumberFixedValue(percentDone, 0)}
                      </Text>
                    </View>
                  )
                }
              </View>
            )}
            {showLoadingMenu && (
              <View style={overlayStyles.overlayContent}>
                <Text style={overlayStyles.statusMessageText}>{statusMessages}</Text>
                {statusMessages.includes('Installing tiles...')
                  && !statusMessages.includes('Downloading Tiles...') && (
                    <View>
                      <Text style={overlayStyles.contentText}>Installing: {tilesToInstall}</Text>
                      <Text style={overlayStyles.contentText}>Already Installed: {installedTiles}</Text>
                    </View>
                  )}
              </View>
            )}
            {isError && (
              <View style={overlayStyles.overlayContent}>
                <Text style={overlayStyles.titleText}>Something Went Wrong!</Text>
                <Text style={overlayStyles.contentText}>{errorMessage}</Text>
              </View>
            )}
            {showComplete && (
              <View style={overlayStyles.overlayContent}>
                <Text style={overlayStyles.titleText}>Success!</Text>
                <Text style={overlayStyles.contentText}>Your map has been successfully downloaded to this device.</Text>
                <View>
                  <Text style={overlayStyles.contentText}>Installing: {tilesToInstall}</Text>
                  <Text style={overlayStyles.contentText}>Already Installed: {installedTiles}</Text>
                </View>
              </View>
            )}
          </View>
          <View>
            {showMainMenu && (
              <View>
                {isSelected && (
                  <Text style={overlayStyles.contentText}>
                    Endpoint URL: {endpoint}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
      {isLoadingCircle && <ActivityIndicator color={themes.BLACK} size={'large'}/>}
    </ModalWrapper>
  );
};

export default SaveMapsModal;
