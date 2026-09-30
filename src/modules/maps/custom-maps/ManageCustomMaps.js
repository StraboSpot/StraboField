import React from 'react';
import {FlatList} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {
  getCustomMapsForDatabase, getMapTypeName, isLiveCustomMapSource, isOfflineMapOverlayOn,
} from './customMaps.helpers';
import useCustomMap from './useCustomMap';
import commonStyles from '../../../shared/common.styles';
import {MEDIUMGREY, PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';
import AddButton from '../../../shared/ui/buttons/AddButton';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import SectionDivider from '../../../shared/ui/SectionDivider';
import useIsConnectionAvailable from '../../connections/useConnectionStatus';
import {getOfflineMap} from '../offline-maps/offlineMaps.helpers';
import useMapsOffline from '../offline-maps/useMapsOffline';
import useMap from '../useMap';

const ManageCustomMaps = ({zoomToCustomMap, zoomToOfflineMapTiles}) => {
  // console.log('Rendering ManageCustomMaps...');

  /* Data Hooks */

  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const customMaps = useSelector(state => state.map.customMaps);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const {isSelected, endpoint} = useSelector(state => state.connections.databaseEndpoint);

  const isConnectionAvailable = useIsConnectionAvailable();

  const {getCustomMapDetails, setCustomMapOverlay} = useCustomMap();
  const {setBasemap} = useMap();
  const {setOfflineMapTiles} = useMapsOffline();

  /* Derived Variables */

  const customMapsToDisplay = getCustomMapsForDatabase(customMaps, isSelected);

  /* Logic Helpers */

  // The copy of the map downloaded to this device, if it has any tiles
  const getDownloadedMap = (item) => {
    const offlineMap = getOfflineMap(offlineMaps, item);
    return offlineMap?.count > 0 ? offlineMap : undefined;
  };

  const viewCustomMap = async (item) => {
    if (!isConnectionAvailable) return viewDownloadedMap(item);
    let bbox = item.bbox;
    if (item.overlay) {
      setCustomMapOverlay(item, true);
      // A map cannot be the basemap and an overlay at once, so only a basemap that is this map is handed back
      if (currentBasemap?.id === item.id) await setBasemap();
    }
    // Setting the basemap fetches the map's extent when it has none yet
    else bbox = (await setBasemap(item.id))?.bbox;
    if (bbox) zoomToCustomMap(bbox);
  };

  // Offline, the map is only what was downloaded of it, so it is framed by its tiles rather than its extent. An
  // overlay that is switched on already draws from its download, so it is only framed.
  const viewDownloadedMap = async (item) => {
    try {
      const downloadedMap = getDownloadedMap(item);
      if (!isOfflineMapOverlayOn(customMaps, offlineMaps, downloadedMap)) await setOfflineMapTiles(downloadedMap);
      await zoomToOfflineMapTiles(downloadedMap.id);
    }
    catch (err) {
      console.error('Error viewing downloaded map', err);
    }
  };

  /* Render Functions */

  const renderCustomMapListItem = (item) => {
    const canViewMap = isConnectionAvailable || !!getDownloadedMap(item);
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        key={item.id}
        onPress={() => getCustomMapDetails(item)}
      >
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{item.title}</ListItem.Title>
          <ListItem.Subtitle style={commonStyles.listItemSubtitle}>{getMapTypeName(item.source)}</ListItem.Subtitle>
        </ListItem.Content>
        {/* A map being looked into, rather than a plain map: every row here is already a map, so only the
            magnifier says anything about what pressing it does - go and look at this one. */}
        {isLiveCustomMapSource(item.source) && (
          <Icon
            accessibilityLabel={'View on map'}
            color={canViewMap ? PRIMARY_ACCENT_COLOR : MEDIUMGREY}
            disabled={!canViewMap}
            disabledStyle={{backgroundColor: 'transparent'}}
            name={'map-search-outline'}
            onPress={() => viewCustomMap(item)}
            type={'material-community'}
          />
        )}
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  /* View */

  return (
    <>
      <AddButton onPress={() => getCustomMapDetails({})} title={'Add New Custom Map'}/>
      <SectionDivider
        dividerText={'Custom Maps'}
        subtitle={isSelected ? `Endpoint: ${endpoint.replace('/db', '')}` : undefined}
      />
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No Custom Maps'}/>}
        data={customMapsToDisplay}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({item}) => renderCustomMapListItem(item)}
      />
    </>
  );
};

export default ManageCustomMaps;
