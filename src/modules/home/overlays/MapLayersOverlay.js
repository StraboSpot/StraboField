import React, {useEffect, useState} from 'react';
import {FlatList, Switch, Text, View} from 'react-native';

import {Icon, ListItem, Overlay} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import overlayStyles from './overlay.styles';
import commonStyles from '../../../shared/common.styles';
import {truncateText} from '../../../shared/Helpers';
import * as themes from '../../../shared/styles.constants';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import SectionDivider from '../../../shared/ui/SectionDivider';
import useCustomMap from '../../maps/custom-maps/useCustomMap';
import {BASEMAPS} from '../../maps/maps.constants';
import useMapsOffline from '../../maps/offline-maps/useMapsOffline';
import useMap from '../../maps/useMap';

const MapLayersOverlay = ({mapComponentRef, onTouchOutside, overlayStyle, visible}) => {

  const {setCustomMapSwitchValue} = useCustomMap();
  const {setBasemap} = useMap();
  const {setOfflineMapTiles} = useMapsOffline();

  const [dialogTitle, setDialogTitle] = useState('Map Layers');

  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const customEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const customMaps = useSelector(state => state.map.customMaps);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const {isConnected, isInternetReachable} = useSelector(state => state.connections.isOnline);

  useEffect(() => {
    if (customEndpoint.isSelected) setDialogTitle(`Map Layers - ${customEndpoint.endpoint}`);
  }, []);

  const isValidSource = map => map.source === 'mapbox_styles' || map.source === 'strabospot_mymaps';

  const getCustomMapsWithValidSources = maps => Object.values(maps).filter(m => isValidSource(m) && !m.overlay);

  const getCustomOverlaysWithValidSources = maps => Object.values(maps).filter(m => isValidSource(m) && m.overlay);

  const renderDefaultBasemapsList = () => {
    let sectionTitle = 'Default Basemaps';
    let mapsToDisplay = BASEMAPS;
    if (!isInternetReachable && !isConnected) {
      mapsToDisplay = Object.values(offlineMaps).reduce((acc, offlineMap) => {
        return offlineMap.id === 'mapbox.outdoors' || offlineMap.id === 'mapbox.satellite' || offlineMap.id === 'osm'
        || offlineMap.id === 'macrostrat' || offlineMap.id === 'usgs.hillshade'
          ? [...acc, offlineMap]
          : acc;
      }, []);
      sectionTitle = 'Offline Default Basemaps';
    }
    return (
      <View key={'DefaultMapsList'}>
        <SectionDivider dividerText={sectionTitle}/>
        <FlatList
          keyExtractor={item => item.id + 'DefaultMap'}
          data={mapsToDisplay}
          renderItem={({item}) => renderDefaultMapItem(item)}
          ItemSeparatorComponent={FlatListItemSeparator}
          scrollEnabled={false}
          ListEmptyComponent={<ListEmptyText text={`No ${sectionTitle}`}/>}
        />
      </View>
    );
  };

  const renderCustomMapsList = () => {
    const sectionTitle = 'Custom Basemaps';
    let customMapsToDisplay = getCustomMapsWithValidSources(customMaps).filter(
      customMap => customEndpoint.isSelected ? customMap.url[0].includes('192.') : !customMap.url[0].includes('192.'));

    return (
      <View key={'CustomMapsList'}>
        <SectionDivider dividerText={sectionTitle}/>
        <FlatList
          keyExtractor={item => item.id + 'CustomMap'}
          data={customMapsToDisplay}
          renderItem={({item}) => renderCustomMapItem(item)}
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={`No ${sectionTitle}`}/>}
        />
      </View>
    );
  };

  const renderOfflineCustomMapsList = () => {
    const sectionTitle = 'Offline Custom Basemaps';
    const offlineCustomMapsToDisplay = getCustomMapsWithValidSources(customMaps).filter(
      customMap => offlineMaps[customMap.id]);

    return (
      <View key={'OfflineCustomMapsList'}>
        <SectionDivider dividerText={sectionTitle}/>
        <FlatList
          keyExtractor={item => item.id + 'OfflineCustomMap'}
          data={offlineCustomMapsToDisplay}
          renderItem={({item}) => renderOfflineCustomMapItem(item)}
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={`No ${sectionTitle}`}/>}
        />
      </View>
    );
  };

  const renderCustomOverlaysList = () => {
    let sectionTitle = 'Custom Overlays';
    let customOverlaysToDisplay = getCustomOverlaysWithValidSources(customMaps).filter(
      customMap => customEndpoint.isSelected ? customMap.url[0].includes('192.') : !customMap.url[0].includes('192.'));

    return (
      <View key={'CustomOverlaysList'}>
        <SectionDivider dividerText={sectionTitle}/>
        <FlatList
          keyExtractor={item => item.id + 'CustomOverlay'}
          data={customOverlaysToDisplay}
          renderItem={({item}) => renderMapOverlayItem(item)}
          ListEmptyComponent={<ListEmptyText text={`No ${sectionTitle}`}/>}
        />
      </View>
    );
  };

  const renderOfflineCustomOverlaysList = () => {
    const sectionTitle = 'Offline Custom Overlays';
    const offlineCustomOverlaysToDisplay = getCustomOverlaysWithValidSources(customMaps).filter(
      customOverlay => offlineMaps[customOverlay.id]);

    return (
      <View key={'OfflineCustomOverlaysList'}>
        <SectionDivider dividerText={sectionTitle}/>
        <FlatList
          keyExtractor={item => item.id + 'OfflineCustomOverlay'}
          data={offlineCustomOverlaysToDisplay}
          renderItem={({item}) => renderMapOverlayItem(item)}
          ListEmptyComponent={<ListEmptyText text={`No ${sectionTitle}`}/>}
        />
      </View>
    );
  };

  const renderCustomMapItem = (customMap) => {
    return (
      <ListItem
        key={customMap.id + 'CustomMapItem'}
        onPress={() => onSetBasemap(customMap)}
      >
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>
            {customMap.title || customMap.name || truncateText(customMap?.id, 16)} -
            ({customMap.source || customMap.sources['raster-tiles'].type})
          </ListItem.Title>
        </ListItem.Content>
        {customMap.id === currentBasemap?.id && <Icon type={'ionicon'} color={themes.BLUE} name={'checkmark-outline'}/>}
      </ListItem>
    );
  };

  const renderOfflineCustomMapItem = (customMap) => {
    return (
      <ListItem
        key={customMap.id + 'OfflineCustomMapItem'}
        onPress={() => onSetBasemap(customMap)}
      >
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>
            {customMap.title || customMap.name || truncateText(customMap?.id, 16)} -
            ({customMap.source || customMap.sources['raster-tiles'].type})
          </ListItem.Title>
          {/*{!isInternetReachable && !isConnected*/}
          {/*  && <ListItem.Subtitle style={{paddingTop: 5}}>({customMap.count} tiles!!!)</ListItem.Subtitle>}*/}
        </ListItem.Content>
        {customMap.id === currentBasemap?.id && currentBasemap.sources[currentBasemap.id].tiles[0].includes('file:/')
          && <Icon type={'ionicon'} color={themes.BLUE} name={'checkmark-outline'}/>}
      </ListItem>
    );
  };

  const renderDefaultMapItem = map => (
    <ListItem
      key={map.id + 'DefaultMapItem'}
      onPress={() => isInternetReachable ? setBasemap(map.id) : setOfflineMapTiles(map)}
    >
      <ListItem.Content>
        <ListItem.Title style={commonStyles.listItemTitle}>{map.title || map.name}</ListItem.Title>
        {!isInternetReachable
          && <ListItem.Subtitle style={{paddingTop: 5}}>({map.count} tiles)</ListItem.Subtitle>}
      </ListItem.Content>
      {currentBasemap && currentBasemap.id && map.id === currentBasemap.id
        && <Icon type={'ionicon'} color={themes.BLUE} name={'checkmark-outline'}/>}
    </ListItem>
  );

  const renderMapOverlayItem = (customMap, isOffline) => (
    <ListItem
      containerStyle={overlayStyles.overlayContent}
      key={customMap.id + 'CustomOverlayItem' + (isOffline ? 'Offline' : '')}
    >
      <ListItem.Content>
        <ListItem.Title style={commonStyles.listItemTitle}>{customMap.title || customMap.name} -
          ({customMap.source})</ListItem.Title>
        {!isInternetReachable
          && <ListItem.Subtitle style={{paddingTop: 5}}>({customMap.count} tiles)</ListItem.Subtitle>}
      </ListItem.Content>
      <Switch
        style={{marginRight: 10}}
        value={customMap.isViewable}
        onValueChange={val => setCustomMapSwitchValue(val, customMap)}
      />
    </ListItem>
  );

  const onSetBasemap = async (customMap) => {
    if ((isInternetReachable && isConnected) || (!isInternetReachable && isConnected)) {
      if (!customMap.url) await setOfflineMapTiles(customMap);
      else await setBasemap(customMap.id);
    }
    else await setOfflineMapTiles(customMap);
  };

  const determineWhatCustomMapListToRender = () => {
    if (!isInternetReachable && !isConnected) return [renderCustomMapsList(), renderCustomOverlaysList()];
    else if (isInternetReachable && isConnected) {
      return [
        renderCustomMapsList(),
        renderOfflineCustomMapsList(),
        renderCustomOverlaysList(),
        renderOfflineCustomOverlaysList(),
      ];
    }
    else return [renderOfflineCustomMapsList(), renderOfflineCustomOverlaysList()];
  };

  return (
    <Overlay
      animationType={'slide'}
      backdropStyle={{backgroundColor: 'transparent'}}
      isVisible={visible}
      onBackdropPress={onTouchOutside}
      overlayStyle={[overlayStyles.overlayContainer, overlayStyle]}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={overlayStyles.titleContainer}>
        <Text style={[overlayStyles.titleText]}>{dialogTitle}</Text>
      </View>
      <FlatList
        ListHeaderComponent={
          <>
            {renderDefaultBasemapsList()}
            {determineWhatCustomMapListToRender()}
          </>
        }
      />
    </Overlay>
  );
};

export default MapLayersOverlay;
