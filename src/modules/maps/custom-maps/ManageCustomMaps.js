import React, {useEffect, useState} from 'react';
import {FlatList} from 'react-native';

import {Icon, ListItem} from 'react-native-elements';
import {useSelector} from 'react-redux';

import useCustomMap from './useCustomMap';
import commonStyles from '../../../shared/common.styles';
import {PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';
import AddButton from '../../../shared/ui/AddButton';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import SectionDivider from '../../../shared/ui/SectionDivider';
import {DEFAULT_MAPS} from '../maps.constants';
import useMap from '../useMap';

const ManageCustomMaps = ({zoomToCustomMap}) => {
  // console.log('Rendering ManageCustomMaps...');

  // let filteredMaps = [];

  const customMaps = useSelector(state => state.map.customMaps);
  const {isSelected, endpoint} = useSelector(state => state.connections.databaseEndpoint);
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const isOnline = useSelector(state => state.connections.isOnline);

  const [filteredMaps, setFilteredMaps] = useState([]);
  const [customEndpoint, setCustomEndpoint] = useState([]);

  const {getCustomMapDetails, updateMap} = useCustomMap();
  const {setBasemap} = useMap();

  const {isInternetReachable, isConnected} = isOnline;

  useEffect(() => {
     const maps = isSelected ? filterCustomEndpointCustomMaps() : filterDefaultCustomMaps();
     setFilteredMaps(maps);
    console.log('MAPS', maps);
  }, []);

  const filterDefaultCustomMaps = () => {
    return Object.values(customMaps).filter(map => map.url[0].includes('https://strabospot.org/geotiff/tiles/'));
  }

  const filterCustomEndpointCustomMaps = () => {
    return Object.values(customMaps).filter(map => map.url[0].includes('http://'));
  }

  const mapTypeName = (source) => {
    let name;
    if (source === 'mapbox_styles') name = 'Mapbox Styles';
    if (source === 'map_warper') name = 'Map Warper (Not Supported)';
    if (source === 'strabospot_mymaps') name = 'Strabo MyMaps';
    return name;
  };

  const renderCustomMapListItem = (item) => {
    console.log(item)
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        key={item.id}
        onPress={() => getCustomMapDetails(item)}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{item.title}</ListItem.Title>
          <ListItem.Subtitle>({mapTypeName(item.source)} - {item.id})</ListItem.Subtitle>
        </ListItem.Content>
        {(item.source === 'mapbox_styles' || item.source === 'strabospot_mymaps') && (
          <Icon
            disabled={!isInternetReachable && !isConnected}
            disabledStyle={{backgroundColor: 'transparent'}}
            name={(isInternetReachable && isConnected) || !isInternetReachable && isConnected ? 'map-outline'
              : !isInternetReachable && !isConnected ? 'cloud-offline' : null}
            type={'ionicon'}
            color={PRIMARY_ACCENT_COLOR}
            onPress={() => viewCustomMap(item)}
          />
        )}
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  const viewCustomMap = async (item) => {
    if (item.overlay) {
      updateMap({...item, isViewable: true});
      if (DEFAULT_MAPS.every(map => currentBasemap.id !== map.id)) await setBasemap();
    }
    else await setBasemap(item.id);
    item?.bbox && setTimeout(() => zoomToCustomMap(item.bbox), 1000);
  };

  return (
    <>
      <AddButton
        onPress={() => getCustomMapDetails({})}
        title={'Add New Custom Map'}
        type={'outline'}
      />
      <SectionDivider dividerText={'Current Custom Maps'}/>
      {isSelected && <SectionDivider textStyle={{fontSize: 12, textAlign: 'center'}} dividerText={`Endpoint: ${endpoint.replace('/db', '')}`}/>}
      <FlatList
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        data={filteredMaps}
        renderItem={({item}) => renderCustomMapListItem(item)}
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No Custom Maps'}/>}
      />
    </>
  );
};

export default ManageCustomMaps;
