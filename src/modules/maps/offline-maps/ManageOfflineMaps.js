import React, {useState} from 'react';
import {FlatList, TouchableOpacity} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {getOfflineMapTitle} from './offlineMaps.helpers';
import {editedOfflineMap, startedOfflineMapPreview} from './offlineMaps.slice';
import styles from './offlineMaps.styles';
import useMapsOffline from './useMapsOffline';
import useDevice from '../../../services/device/useDevice';
import commonStyles from '../../../shared/common.styles';
import {isEmpty, truncateText} from '../../../shared/helpers';
import {MEDIUMGREY, PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';
import alert from '../../../shared/ui/alert';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import Loading from '../../../shared/ui/Loading';
import SectionDividerWithRightButton from '../../../shared/ui/SectionDividerWithRightButton';
import TextInputModal from '../../../shared/ui/TextInputModal';
import {setIsOfflineMapsModalVisible} from '../../home/home.slice';
import {isDefaultMap} from '../maps.helpers';

const ManageOfflineMaps = ({closeMainMenuPanel, zoomToOfflineMapTiles}) => {
  console.log('Rendering ManageOfflineMaps...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline);
  const {isSelected} = useSelector(state => state.connections.databaseEndpoint);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const previewedOfflineMapId = useSelector(state => state.offlineMap.previewedOfflineMapId);

  const {deleteOfflineMap} = useDevice();
  const {getSavedMapsFromDevice, setOfflineMapTiles, stopOfflineMapPreview, switchToOfflineMap} = useMapsOffline();

  /* Local State */

  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMap, setSelectedMap] = useState({});

  /* Logic Helpers */

  const confirmDeleteMap = () => {
    alert(
      'Delete Offline Map',
      `Are you sure you want to delete ${selectedMap.count} tiles in ${selectedMap.name}?`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: deleteMap,
        },
      ],
      {cancelable: false},
    );
  };

  const deleteMap = async () => {
    // The confirmation has been answered, so the rename modal it came from has done its job. Closing it up
    // front also keeps a failure alert from being raised while a modal is still on screen.
    setIsNameModalVisible(false);
    try {
      // A preview shows this map's tiles as the basemap, so put a live one back before they go
      if (selectedMap.id === previewedOfflineMapId) await stopOfflineMapPreview();
      await deleteOfflineMap(selectedMap);
    }
    catch (err) {
      console.error('Error deleting offline map', err);
      alert('Error', `Unable to delete ${selectedMap.name}.`);
    }
  };

  const editMap = (map) => {
    setSelectedMap(map);
    setIsNameModalVisible(true);
  };

  const handDownloadMapTilesPressed = () => {
    closeMainMenuPanel();
    dispatch(setIsOfflineMapsModalVisible(true));
  };

  const saveMapEdits = () => {
    console.log('Map name saved!', selectedMap.name);
    dispatch(editedOfflineMap(selectedMap));
    setIsNameModalVisible(false);
  };

  // Shows the map with only its downloaded tiles, so its coverage can be checked without disconnecting.
  // Genuinely offline behavior is a different thing: that runs the offline path in MapContainer.
  const toggleOfflineMapPreview = async (item) => {
    try {
      if (item.id === previewedOfflineMapId) return await stopOfflineMapPreview();
      dispatch(startedOfflineMapPreview(item.id));
      await switchToOfflineMap(item.id);
      await zoomToOfflineMapTiles(item.id);
    }
    catch (err) {
      console.error('Error previewing offline map', err);
    }
  };

  // Offline, the downloaded tiles are the map, so this is the custom maps' view button rather than a preview:
  // show the map and frame what was downloaded of it. An overlay is only framed, since whether it is drawn is
  // set in Map Layers, over whichever basemap is showing.
  const viewOfflineMap = async (item) => {
    try {
      if (!item.overlay) await setOfflineMapTiles(item);
      await zoomToOfflineMapTiles(item.id);
    }
    catch (err) {
      console.error('Error viewing offline map', err);
    }
  };

  const updateMapsFromDevice = async () => {
    try {
      setLoading(true);
      await getSavedMapsFromDevice();
      console.log('Got maps from device');
    }
    catch (err) {
      console.error('Error getting maps from device', err);
      alert('Error', 'Unable to read the offline maps saved on this device.');
    }
    finally {
      // The maps list is hidden while loading, so a failure that left this set would hide it indefinitely.
      setLoading(false);
    }
  };

  /* Render Functions */

  const renderEditMapModal = () => {
    return (
      <TextInputModal
        dialogTitle={'Edit Map Name'}
        onActionPressed={() => saveMapEdits()}
        onCancelPress={() => setIsNameModalVisible(false)}
        onChangeText={text => setSelectedMap({...selectedMap, name: text})}
        onDeletePress={confirmDeleteMap}
        placeholder={selectedMap.name}
        showDeleteButton={true}
        value={selectedMap.name}
        visible={isNameModalVisible}
      />
    );
  };

  const renderMapsList = () => {
    return (
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={
          <ListEmptyText
            containerStyle={{padding: 20}}
            text={'No Offline Maps.\n\nIf you just logged in press the reload button in the upper right to load your offline maps from the device.\n\nTo download a map select area and zoom'
              + ' level on map then select "Download tiles of current map"'}
            textStyle={{textAlign: 'center'}}
          />}
        data={Object.values(offlineMaps)}
        keyExtractor={item => item.id}
        renderItem={({item}) => renderMapsListItem(item)}
      />
    );
  };

  const renderMapsListItem = (item) => {
    const isPreviewed = item.id === previewedOfflineMapId;
    // A default basemap is named by the app, so only a map the user added can be renamed
    const isRenameable = !isDefaultMap(item);
    return (
      <ListItem
        containerStyle={commonStyles.listItemFormField}
        key={item.id}
      >
        <ListItem.Content style={styles.itemContainer}>
          <TouchableOpacity
            disabled={!isRenameable}
            onPress={() => editMap(item)}
            style={styles.nameContainer}
          >
            <ListItem.Title style={[commonStyles.listItemTitle, isRenameable && styles.renameableTitle]}>
              {!isEmpty(item) ? truncateText(getOfflineMapTitle(item), 20) : 'No Name'}
            </ListItem.Title>
            <ListItem.Subtitle style={[commonStyles.listItemSubtitle, item.count === 0 && styles.noTilesText]}>
              {item.count === 0 ? 'No tiles downloaded' : `${item.count} tiles`}
            </ListItem.Subtitle>
          </TouchableOpacity>
          {isOnline.isInternetReachable && !item.overlay && (
            <OutlineButton
              containerStyle={styles.previewButtonContainer}
              disabled={item.count === 0}
              onPress={() => toggleOfflineMapPreview(item)}
              title={isPreviewed ? 'Stop' : 'Preview'}
            />
          )}
          {!isOnline.isInternetReachable && (
            <Icon
              accessibilityLabel={'View on map'}
              color={item.count === 0 ? MEDIUMGREY : PRIMARY_ACCENT_COLOR}
              disabled={item.count === 0}
              disabledStyle={{backgroundColor: 'transparent'}}
              name={'map-search-outline'}
              onPress={() => viewOfflineMap(item)}
              type={'material-community'}
            />
          )}
        </ListItem.Content>
      </ListItem>
    );
  };

  /* View */

  return (
    <>
      <OutlineButton
        disabled={(!isOnline.isInternetReachable && !isOnline.isConnected) || isSelected || !!previewedOfflineMapId}
        onPress={handDownloadMapTilesPressed}
        title={'Download Tiles of Current Map'}
      />
      <SectionDividerWithRightButton
        dividerText={'Offline Maps'}
        iconName={'reload-outline'}
        onPress={updateMapsFromDevice}
      />
      {!loading && renderMapsList()}

      {/* Modals */}
      {renderEditMapModal()}
      <Loading
        isLoading={loading}
        text={'Checking and adjusting tile count'}
      />
    </>
  );
};

export default ManageOfflineMaps;
