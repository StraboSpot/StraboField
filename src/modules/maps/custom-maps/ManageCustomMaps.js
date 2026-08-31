import React, {useEffect, useState} from 'react';
import {FlatList, Text} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {getMapTypeName} from './customMaps.helpers';
import useCustomMap from './useCustomMap';
import commonStyles from '../../../shared/common.styles';
import {PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';
import AddButton from '../../../shared/ui/buttons/AddButton';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import SectionDivider from '../../../shared/ui/SectionDivider';
import {DEFAULT_MAPS} from '../maps.constants';
import useMap from '../useMap';

const ManageCustomMaps = ({zoomToCustomMap}) => {
  // console.log('Rendering ManageCustomMaps...');

  /* Data Hooks */

  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const customMaps = useSelector(state => state.map.customMaps);
  const isOnline = useSelector(state => state.connections.isOnline);
  const {isSelected, endpoint} = useSelector(state => state.connections.databaseEndpoint);

  const {getCustomMapDetails, updateMap} = useCustomMap();
  const {setBasemap} = useMap();

  /* Local State */

  const [filteredMaps, setFilteredMaps] = useState([]);

  /* Derived Variables */

  const {isInternetReachable, isConnected} = isOnline;

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
      updateMap({...basemap, isViewable: true});
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
        {(item.source === 'mapbox_styles' || item.source === 'strabospot_mymaps') && (
          <Icon
            color={PRIMARY_ACCENT_COLOR}
            disabled={!isInternetReachable && !isConnected}
            disabledStyle={{backgroundColor: 'transparent'}}
            name={(isInternetReachable && isConnected) || !isInternetReachable && isConnected ? 'map-outline'
              : !isInternetReachable && !isConnected ? 'cloud-offline' : null}
            onPress={() => viewCustomMap(item)}
            type={'ionicon'}
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
