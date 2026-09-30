import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import MultiSelect from 'react-native-multiple-select';
import ProgressBar from 'react-native-progress/Bar';
import {useDispatch, useSelector} from 'react-redux';

import {getTileFolderName} from './offlineMaps.helpers';
import {calculateScaleRatio} from './scale';
import useMapsOffline from './useMapsOffline';
import useDevice from '../../../services/device/useDevice';
import {APP_DIRECTORIES} from '../../../services/files/directories.constants';
import useServerRequests from '../../../services/network/useServerRequests';
import {toNumberFixedValue} from '../../../shared/helpers';
import * as themes from '../../../shared/styles.constants';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import formStyles from '../../form/form.styles';
import {
  addedStatusMessage,
  clearedStatusMessages,
  removedLastStatusMessage,
  setIsOfflineMapsModalVisible,
} from '../../home/home.slice';
import {getVisibleCustomOverlays, isLiveCustomMapSource} from '../custom-maps/customMaps.helpers';
import {MAP_PROVIDERS} from '../maps.constants';

// The modal's body had been given contentText - a style meant for a line of text, whose fontSize and textAlign
// do nothing on a View and whose 5pt padding was the whole gutter the content had.
const contentContainerStyle = {paddingHorizontal: 20, paddingVertical: 10};
// The forms' own dropdown: an underlined field with its label above it, opening a list in place. Reusing their
// styles rather than restyling a native picker is what actually makes these two look like the rest of the app.
const dropdownFieldStyle = {...formStyles.fieldValue, marginBottom: 15, paddingBottom: 0};
// fieldLabel centers itself, which suits the forms' label row but not a label standing alone above a field
const dropdownLabelStyle = {...formStyles.fieldLabel, alignSelf: 'flex-start'};
// Supporting detail under the dropdowns, kept quieter than the choices themselves
const noteStyle = {color: themes.DARKGREY, fontSize: themes.SMALL_TEXT_SIZE, paddingBottom: 5};
const mapNameStyle = {
  fontSize: themes.MEDIUM_TEXT_SIZE,
  fontWeight: 'bold',
  paddingBottom: 15,
  textAlign: 'center',
};

const SaveMapsModal = ({getCurrentZoom, getExtentString, getTileCount}) => {
  // console.log('Rendering SaveMapsModal...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const customMaps = useSelector(state => state.map.customMaps);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
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
  const [mapToSaveId, setMapToSaveId] = useState(currentBasemap.id);
  const [percentDone, setPercentDone] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [showLoadingBar, setShowLoadingBar] = useState(false);
  const [showLoadingMenu, setShowLoadingMenu] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [tileCount, setTileCount] = useState(0);
  const [tilesToInstall, setTilesToInstall] = useState(0);
  const [zoomLevels, setZoomLevels] = useState([]);

  /* Derived Variables */

  // An overlay is a map in its own right, so it can be the one saved. Only the ones drawn from a provider are
  // offered: an overlay that is already a copy on this device has nothing left to download.
  const savableMaps = [
    currentBasemap,
    ...getVisibleCustomOverlays(customMaps, offlineMaps).filter(map => isLiveCustomMapSource(map.source)),
  ];
  const mapToSave = savableMaps.find(map => map.id === mapToSaveId) || currentBasemap;
  const mapToSaveName = mapToSave.title || mapToSave.name;
  const maxZoom = MAP_PROVIDERS[mapToSave.source]?.maxZoom;
  const mapChoices = savableMaps.map(map => ({label: map.title || map.name, value: map.id}));
  // Tiles already on the device for this map, which a download adds to rather than replaces
  const savedTileCount = offlineMaps[getTileFolderName(mapToSave.id, mapToSave.source)]?.count;

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
  }, [getCurrentZoom, mapToSaveId]);

  useEffect(() => {
    console.log('UE SaveMapsModal [downloadZoom]', downloadZoom);
    console.log('extentString is UE', extentString);
    shouldDownload().catch(err => console.error('Error in SaveMapsModal shouldDownload()', err));
  }, [downloadZoom]);

  /* Render Functions */

  // Single select, so onSelectedItemsChange hands back an array of one. Re-picking the value a field already
  // holds clears it in the forms, which suits a field that can be left empty - neither of these can be, so the
  // old value is kept instead.
  const renderDropdown = (label, choices, selectedValue, onValuePicked, promptNoun) => {
    const selected = choices.find(choice => choice.value === selectedValue);
    return (
      <View>
        <Text style={dropdownLabelStyle}>{label}</Text>
        <View style={dropdownFieldStyle}>
          <MultiSelect
            displayKey={'label'}
            fontSize={themes.PRIMARY_TEXT_SIZE}
            hideDropdown={true}
            hideSubmitButton={true}
            hideTags={true}
            itemTextColor={themes.PRIMARY_TEXT_COLOR}
            items={choices}
            onSelectedItemsChange={values => onValuePicked(values[0] ?? selectedValue)}
            searchIcon={false}
            searchInputPlaceholderText={selected?.label ?? `-- Select ${promptNoun} --`}
            selectText={selected?.label ?? `-- Select ${promptNoun} --`}
            selectedItemIconColor={themes.PRIMARY_TEXT_COLOR}
            selectedItemTextColor={themes.PRIMARY_TEXT_COLOR}
            selectedItems={selected ? [selected.value] : []}
            single
            styleDropdownMenu={formStyles.dropdownContainer}
            styleDropdownMenuSubsection={formStyles.dropdownSelectedContainer}
            styleIndicator={formStyles.dropdownIndicator}
            styleInputGroup={formStyles.dropdownInputGroup}
            styleItemsContainer={formStyles.dropdownItemsContainer}
            textColor={themes.PRIMARY_TEXT_COLOR}
            textInputProps={{editable: false}}
            uniqueKey={'value'}
          />
        </View>
      </View>
    );
  };

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

  // A function rather than a derived variable, since it needs getScale, which is declared after those run
  const getZoomChoices = () => zoomLevels.map(zoom => ({label: zoom.toString() + getScale(zoom), value: zoom}));

  const saveMap = async () => {
    try {
      setShowMainMenu(false);
      setShowLoadingMenu(true);
      setShowLoadingBar(true);
      setIsLoadingWave(true);
      setIsLoadingCircle(false);
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Gathering Tiles...'));
      const zipId = await initializeSaveMap(extentString, downloadZoom, mapToSave);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Preparing Data...'));
      await checkZipStatus(zipId);
      setShowLoadingBar(false);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Data ready to download.'));
      await downloadZip(zipId);
      const tileArray = await moveFiles(zipId, mapToSave);
      await tileMove(tileArray, zipId);
      // The folder the tiles actually went into, which is not the map id for a Mapbox style - getTileFolderName
      // drops the account prefix, and the offline map has to be keyed and pathed to where its tiles are.
      await updateMapTileCountWhenSaving(getTileFolderName(mapToSave.id, mapToSave.source));
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
      const progress = await moveTile(tile, undefined, mapToSave);
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
      headerTitle={'Save Map for Offline Use'}
      onActionPressed={saveMap}
      onCancelPress={() => dispatch(setIsOfflineMapsModalVisible(false))}
      overlayStyleOverride={{height: 'auto'}}
      showActionButton={showMainMenu}
      showCancelButton={showMainMenu || showComplete || isError}
    >
      <View style={contentContainerStyle}>
        <View>
          <View>
            {showMainMenu && (
              <View>
                {/* Named here rather than in the modal's title, which now says what the modal does: with a map
                    to choose, a title naming one of them reads as a heading over a choice it has pre-made. */}
                {savableMaps.length === 1 && <Text style={mapNameStyle}>{mapToSaveName}</Text>}
                {/* Only worth asking when an overlay is drawn over the basemap, since otherwise there is only
                    one map it could mean */}
                {savableMaps.length > 1
                  && renderDropdown('Map', mapChoices, mapToSaveId, value => setMapToSaveId(value), 'a map')}
                {renderDropdown('Max Zoom', getZoomChoices(), downloadZoom, value => updatePicker(value), 'a zoom level')}
                <Text style={noteStyle}>
                  Saves the area shown on the map, down to the zoom level picked above.
                </Text>
                {/* Downloading again adds to what is already there - moveTile keeps the tiles it finds and
                    fetches only the rest - so a map's saved area is extended by framing more of it and saving. */}
                {savedTileCount > 0 && (
                  <Text style={noteStyle}>
                    {savedTileCount.toLocaleString()} tiles of this map are already on this device. Saving again
                    adds to them, so you can extend a saved area.
                  </Text>
                )}
                {isSelected && <Text style={noteStyle}>Server: {endpoint}</Text>}
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
        </View>
      </View>
      {isLoadingCircle && <ActivityIndicator color={themes.BLACK} size={'large'}/>}
    </ModalWrapper>
  );
};

export default SaveMapsModal;
