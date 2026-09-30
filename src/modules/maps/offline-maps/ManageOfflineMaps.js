import React, {useState} from 'react';
import {FlatList, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {getOfflineMapTitle} from './offlineMaps.helpers';
import {selectedOfflineMap} from './offlineMaps.slice';
import styles from './offlineMaps.styles';
import useMapsOffline from './useMapsOffline';
import commonStyles from '../../../shared/common.styles';
import {isEmpty, truncateText} from '../../../shared/helpers';
import {MEDIUMGREY, PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';
import alert from '../../../shared/ui/alert';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import Loading from '../../../shared/ui/Loading';
import SectionDividerWithRightButton from '../../../shared/ui/SectionDividerWithRightButton';
import {setIsOfflineMapsModalVisible} from '../../home/home.slice';
import {SIDE_PANEL_VIEWS} from '../../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import {isOfflineMapOverlayOn} from '../custom-maps/customMaps.helpers';

const ManageOfflineMaps = ({closeMainMenuPanel, zoomToOfflineMapTiles}) => {
  console.log('Rendering ManageOfflineMaps...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const {isSelected} = useSelector(state => state.connections.databaseEndpoint);
  const customMaps = useSelector(state => state.map.customMaps);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const previewedOfflineMapId = useSelector(state => state.offlineMap.previewedOfflineMapId);
  // Follows the map, which shows offline maps whenever the internet cannot be reached
  const {isInternetReachable} = useSelector(state => state.connections.isOnline);

  const {
    getSavedMapsFromDevice, setOfflineMapTiles, startOfflineMapPreview, stopOfflineMapPreview,
  } = useMapsOffline();

  /* Local State */

  const [loading, setLoading] = useState(false);

  /* Logic Helpers */

  const handleDownloadMapTilesPressed = () => {
    closeMainMenuPanel();
    dispatch(setIsOfflineMapsModalVisible(true));
  };

  const openMapDetails = (map) => {
    dispatch(selectedOfflineMap(map.id));
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.OFFLINE_MAP_DETAILS}));
  };

  // Shows the map with only its downloaded tiles, so its coverage can be checked without disconnecting.
  // Genuinely offline behavior is a different thing: that runs the offline path in MapContainer.
  const toggleOfflineMapPreview = async (item) => {
    try {
      if (item.id === previewedOfflineMapId) return await stopOfflineMapPreview();
      await startOfflineMapPreview(item.id);
      await zoomToOfflineMapTiles(item.id);
    }
    catch (err) {
      console.error('Error previewing offline map', err);
    }
  };

  // Offline, the downloaded tiles are the map, so this is the custom maps' view button rather than a preview:
  // show the map and frame what was downloaded of it. A map switched on as an overlay is already drawn, so it is
  // only framed.
  const viewOfflineMap = async (item) => {
    try {
      if (!isOfflineMapOverlayOn(customMaps, offlineMaps, item)) await setOfflineMapTiles(item);
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

  const renderMapsList = () => {
    return (
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={
          <ListEmptyText
            containerStyle={{padding: 20}}
            text={'No offline maps.\n\nIf you just logged in, tap the reload button above to find the offline maps'
              + ' already on this device.\n\nTo save one, frame the area you need on the map, then tap'
              + ' "Download Tiles of Current Map".'}
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
    return (
      <ListItem
        containerStyle={commonStyles.listItemFormField}
        key={item.id}
        onPress={() => openMapDetails(item)}
      >
        <ListItem.Content style={styles.itemContainer}>
          <View style={styles.nameContainer}>
            <ListItem.Title style={commonStyles.listItemTitle}>
              {!isEmpty(item) ? truncateText(getOfflineMapTitle(item), 20) : 'No Name'}
            </ListItem.Title>
            <ListItem.Subtitle style={[commonStyles.listItemSubtitle, item.count === 0 && styles.noTilesText]}>
              {item.count === 0 ? 'No tiles downloaded' : `${item.count} tiles`}
            </ListItem.Subtitle>
          </View>
          {isInternetReachable && (
            <OutlineButton
              containerStyle={styles.previewButtonContainer}
              disabled={item.count === 0}
              onPress={() => toggleOfflineMapPreview(item)}
              title={isPreviewed ? 'Stop' : 'Preview'}
            />
          )}
          {!isInternetReachable && (
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
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  /* View */

  return (
    <>
      <OutlineButton
        disabled={!isInternetReachable || isSelected || !!previewedOfflineMapId}
        onPress={handleDownloadMapTilesPressed}
        title={'Download Tiles of Current Map'}
      />
      <SectionDividerWithRightButton
        dividerText={'Offline Maps'}
        iconName={'reload-outline'}
        onPress={updateMapsFromDevice}
      />
      {!loading && renderMapsList()}

      <Loading
        isLoading={loading}
        text={'Checking and adjusting tile count'}
      />
    </>
  );
};

export default ManageOfflineMaps;
