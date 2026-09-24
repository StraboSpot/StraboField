import React, {useEffect, useState} from 'react';
import {FlatList, Text} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {getMapTypeName, isLiveCustomMapSource} from './customMaps.helpers';
import useCustomMap from './useCustomMap';
import commonStyles from '../../../shared/common.styles';
import {MEDIUMGREY, PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';
import AddButton from '../../../shared/ui/buttons/AddButton';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import SectionDivider from '../../../shared/ui/SectionDivider';
import useIsConnectionAvailable from '../../connections/useConnectionStatus';
import {DEFAULT_MAPS} from '../maps.constants';
import useMap from '../useMap';

const ManageCustomMaps = ({zoomToCustomMap}) => {
  // console.log('Rendering ManageCustomMaps...');

  /* Data Hooks */

  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const customMaps = useSelector(state => state.map.customMaps);
  const {isSelected, endpoint} = useSelector(state => state.connections.databaseEndpoint);

  const isConnectionAvailable = useIsConnectionAvailable();

  const {getCustomMapDetails, setCustomMapOverlay} = useCustomMap();
  const {setBasemap} = useMap();

  /* Local State */

  const [filteredMaps, setFilteredMaps] = useState([]);

  /* Side Effects */

  useEffect(() => {
    const maps = isSelected ? filterCustomEndpointCustomMaps() : Object.values(customMaps);
    setFilteredMaps(maps);
    console.log('MAPS', maps);
  }, []);

  /* Logic Helpers */

  const filterCustomEndpointCustomMaps = () => {
    return Object.values(customMaps).filter((map) => {
      map.url[0].includes('http://');
    });
  };

  // const filterDefaultCustomMaps = () => {
  //   return Object.values(customMaps).filter((map) => {
  //     console.log('MAP', map);
  //     // map.url[0].includes('https://strabospot.org/geotiff/tiles/');
  //     return map.url[0].includes('https://api.mapbox.com/styles/v1/');
  //   });
  // };

  const viewCustomMap = async (item) => {
    let basemap = item;
    if (item.overlay) {
      setCustomMapOverlay(basemap, true);
      if (DEFAULT_MAPS.every(map => currentBasemap.id !== map.id)) basemap = await setBasemap();
    }
    else basemap = await setBasemap(item.id);
    basemap.bbox && setTimeout(() => zoomToCustomMap(basemap.bbox), 1000);
  };

  /* Render Functions */

  const renderCustomMapListItem = (item) => {
    console.log(item);
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
            color={isConnectionAvailable ? PRIMARY_ACCENT_COLOR : MEDIUMGREY}
            disabled={!isConnectionAvailable}
            disabledStyle={{backgroundColor: 'transparent'}}
            name={isConnectionAvailable ? 'map-search-outline' : 'cloud-off-outline'}
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
      <SectionDivider dividerText={'Custom Maps'}/>
      {isSelected && <Text style={commonStyles.standardDescriptionText}>Endpoint: {endpoint.replace('/db', '')}</Text>}
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No Custom Maps'}/>}
        data={filteredMaps}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({item}) => renderCustomMapListItem(item)}
      />
    </>
  );
};

export default ManageCustomMaps;
