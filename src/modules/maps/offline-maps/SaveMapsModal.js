import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import {Picker} from '@react-native-picker/picker';
import {Button, Icon, Overlay} from 'react-native-elements';
import ProgressBar from 'react-native-progress/Bar';
import {useDispatch, useSelector} from 'react-redux';

import offlineMapsStyles from './offlineMaps.styles';
import useMapsOffline from './useMapsOffline';
import {APP_DIRECTORIES} from '../../../services/directories.constants';
import useDevice from '../../../services/useDevice';
import useServerRequests from '../../../services/useServerRequests';
import {toNumberFixedValue} from '../../../shared/Helpers';
import * as themes from '../../../shared/styles.constants';
import {
  addedStatusMessage,
  clearedStatusMessages,
  removedLastStatusMessage,
  setIsOfflineMapsModalVisible,
} from '../../home/home.slice';
import overlayStyles from '../../home/overlays/overlay.styles';
import {MAP_PROVIDERS} from '../maps.constants';

const SaveMapsModal = ({map: {getCurrentZoom, getExtentString, getTileCount}}) => {
  // console.log('Rendering SaveMapsModal...');

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
  const {getTilehostUrl} = useServerRequests();

  const dispatch = useDispatch();
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const {protocol, domain, path, isSelected} = useSelector(state => state.connections.databaseEndpoint);
  const isOfflineMapModalVisible = useSelector(state => state.home.isOfflineMapModalVisible);
  const statusMessages = useSelector(state => state.home.statusMessages);

  const currentMapName = currentBasemap && currentBasemap.title;
  const maxZoom = MAP_PROVIDERS[currentBasemap.source]?.maxZoom;

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
    console.log('UE SaveMapsModal [map Props]');
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

  const shouldDownload = async () => {
    if (downloadZoom > 0) {
      setIsLoadingCircle(true);
      updateCount().then(() => {
        console.log('TileCount', tileCount);
      });
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

  const downloadZip = async (zipUID) => {
    try {
      const tilehost = getTilehostUrl();
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
      throw Error(err);
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
        `${editedError}!\n\n Make sure you are pulling the map from the correct endpoint\n(Home => Miscellaneous => Custom Database Endpoint).`);
      setShowMainMenu(false);
      setShowLoadingMenu(false);
      setShowLoadingBar(false);
      setIsLoadingCircle(false);
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

  const updateCount = async () => {
    getTileCount(downloadZoom).then((tileCount) => {
      if (tileCount.count) {
        console.log('downloadZoom from updateCount: ', downloadZoom);
        console.log('downloadZoom tileCount: ', tileCount.count);
        setTileCount(tileCount.count);
        setIsLoadingCircle(false);
        console.log('return_from_mapview_getTileCount: ', tileCount.count);
      }
      else if (tileCount.message) {
        setShowMainMenu(false);
        if (tileCount.message.includes('Invalid extent')) {
          console.error(tileCount.message);
          setErrorMessage('\n\nPlease zoom to level 5 or greater to get a more accurate tiles with features.');
        }
        setIsError(true);
        setIsLoadingCircle(false);
      }
    });
  };

  const updatePicker = async (zoomValue) => {
    await setDownloadZoom(zoomValue);
  };

  return (
    <Overlay
      animationType={'slide'}
      isVisible={isOfflineMapModalVisible}
      backdropStyle={overlayStyles.backdropStyles}
      overlayStyle={[overlayStyles.overlayContainer, offlineMapsStyles.saveModalContainer]}
      onBackdropPress={() => {
        setShowMainMenu(true);
        setShowComplete(false);
      }}
    >
      <Icon
        name={'close-outline'}
        type={'ionicon'}
        size={20}
        color={'darkgrey'}
        onPress={() => dispatch(setIsOfflineMapsModalVisible(false))}
        containerStyle={overlayStyles.closeButton}
      />
      <View style={overlayStyles.titleContainer}>
        <Text style={[overlayStyles.titleText]}>{currentMapName}</Text>
      </View>
      <View style={overlayStyles.contentText}>
        <View>
          <View style={{}}>
            {showMainMenu && (
              <View>
                <Text style={overlayStyles.contentText}>
                  Select max zoom level to download:
                </Text>
                <Picker
                  mode={'dropdown'}
                  prompt={'Select a zoom level'}
                  onValueChange={value => updatePicker(value)}
                  selectedValue={downloadZoom}
                >
                  {zoomLevels.map((zoom) => {
                    return (
                      <Picker.Item
                        style={{width: 100}}
                        key={zoom}
                        value={zoom}
                        label={zoom.toString()}
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
                    <ActivityIndicator size={'large'} color={themes.BLACK}/>
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
                {statusMessages.includes('Installing tiles...') && !statusMessages.includes(
                  'Downloading Tiles...') && (
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
                {isLoadingCircle
                  ? <ActivityIndicator size={'large'} color={themes.BLACK}/>
                  : (
                    <Button
                      onPress={() => saveMap()}
                      type={'clear'}
                      title={`Download ${tileCount} Tiles`}
                    />
                  )}
                {isSelected && (
                  <Text style={overlayStyles.contentText}>
                    Endpoint URL: {protocol + domain + path}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Overlay>
  );
};

export default SaveMapsModal;
