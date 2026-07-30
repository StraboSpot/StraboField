import React, {useEffect, useState} from 'react';
import {Dimensions, FlatList, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {truncateText} from '../../../shared/helpers';
import * as themes from '../../../shared/styles.constants';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import {SwitchWrapper} from '../../../shared/ui';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import SectionDivider from '../../../shared/ui/SectionDivider';
import useCustomMap from '../../maps/custom-maps/useCustomMap';
import {BASEMAPS, DEFAULT_MAPS} from '../../maps/maps.constants';
import useMapsOffline from '../../maps/offline-maps/useMapsOffline';
import useMap from '../../maps/useMap';
import {getCustomMapsWithValidSources, getCustomOverlaysWithValidSources} from '../home.helpers';

const overlayStyle = {...overlayStyles.overlayMapMenuPosition, height: '80%'};

const MapLayersOverlay = ({onTouchOutside, visible}) => {
  /* Data Hooks */

  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const customEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const customMaps = useSelector(state => state.map.customMaps);
  const {isConnected, isInternetReachable} = useSelector(state => state.connections.isOnline);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);

  const {setCustomMapSwitchValue} = useCustomMap();
  const {setBasemap} = useMap();
  const {setOfflineMapTiles} = useMapsOffline();

  /* Local State */

  const [dialogTitle, setDialogTitle] = useState('Map Layers');
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  /* Side Effects */

  useEffect(() => {
    if (customEndpoint.isSelected) setDialogTitle(`Map Layers - ${customEndpoint.endpoint}`);
  }, [customEndpoint.isSelected, customEndpoint.endpoint]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => setDimensions(window));
    return () => subscription?.remove();
  }, []);

  /* Event Handlers */

  const onSetBasemap = async (customMap) => {
    if ((isInternetReachable && isConnected) || (!isInternetReachable && isConnected)) {
      if (!customMap.url) await setOfflineMapTiles(customMap);
      else await setBasemap(customMap.id);
    }
    else await setOfflineMapTiles(customMap);
  };

  /* Logic Helpers */

  const isDefaultMap = map => DEFAULT_MAPS.some(defaultMap => defaultMap.id === map.id);

  const determineWhatCustomMapListToRender = () => {
    if (isInternetReachable && isConnected) return [renderCustomMapsList(), renderCustomOverlaysList()];
    else if (!isInternetReachable && isConnected) {
      return [
        renderCustomMapsList(),
        renderOfflineCustomMapsList(),
        renderCustomOverlaysList(),
        renderOfflineCustomOverlaysList(),
      ];
    }
    else return [renderOfflineCustomMapsList(), renderOfflineCustomOverlaysList()];
  };

  const setMap = async (map) => {
    await setBasemap(map.id);
    SMALL_SCREEN && onTouchOutside();
  };

  /* Render Functions */

  const renderCustomMapItem = (customMap) => {
    return (
      <ListItem
        containerStyle={[
          SMALL_SCREEN && {
            minHeight: 50,
            paddingVertical: 15,
            paddingHorizontal: 20,
          },
        ]}
        key={customMap.id + 'CustomMapItem'}
        onPress={() => onSetBasemap(customMap)}
      >
        <ListItem.Content>
          <ListItem.Title style={[
            commonStyles.listItemTitle,
            SMALL_SCREEN && {
              fontSize: 16,
              fontWeight: '500',
            },
          ]}>
            {customMap.title || customMap.name || truncateText(customMap?.id, 16)} -
            ({customMap.source || customMap.sources['raster-tiles'].type})
          </ListItem.Title>
        </ListItem.Content>
        {customMap.id === currentBasemap?.id && <Icon color={themes.BLUE} name={'checkmark-outline'} type={'ionicon'}/>}
      </ListItem>
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
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={`No ${sectionTitle}`}/>}
          data={customMapsToDisplay}
          keyExtractor={item => item.id + 'CustomMap'}
          renderItem={({item}) => renderCustomMapItem(item)}
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
          ListEmptyComponent={<ListEmptyText text={`No ${sectionTitle}`}/>}
          data={customOverlaysToDisplay}
          keyExtractor={item => item.id + 'CustomOverlay'}
          renderItem={({item}) => renderMapOverlayItem(item)}
        />
      </View>
    );
  };

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
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={`No ${sectionTitle}`}/>}
          data={mapsToDisplay}
          keyExtractor={item => item.id + 'DefaultMap'}
          renderItem={({item}) => renderDefaultMapItem(item)}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderDefaultMapItem = map => (
    <ListItem
      containerStyle={[
        SMALL_SCREEN && {
          minHeight: 50,
          paddingVertical: 15,
          paddingHorizontal: 20,
        },
      ]}
      key={map.id + 'DefaultMapItem'}
      onPress={() => isInternetReachable ? setMap(map) : setOfflineMapTiles(map)}
    >
      <ListItem.Content>
        <ListItem.Title style={[
          commonStyles.listItemTitle,
          SMALL_SCREEN && {
            fontSize: 16,
            fontWeight: '500',
          },
        ]}>{map.title || map.name}</ListItem.Title>
        {!isInternetReachable
          && <ListItem.Subtitle style={{paddingTop: 5}}>({map.count} tiles)</ListItem.Subtitle>}
      </ListItem.Content>
      {currentBasemap && currentBasemap.id && map.id === currentBasemap.id
        && <Icon color={themes.BLUE} name={'checkmark-outline'} type={'ionicon'}/>}
    </ListItem>
  );

  const renderMapOverlayItem = (customMap, isOffline) => (
    <ListItem
      containerStyle={[
        overlayStyles.overlayContent,
        SMALL_SCREEN && {
          minHeight: 50,
          paddingVertical: 15,
          paddingHorizontal: 20,
        },
      ]}
      key={customMap.id + 'CustomOverlayItem' + (isOffline ? 'Offline' : '')}
    >
      <ListItem.Content>
        <ListItem.Title style={[
          commonStyles.listItemTitle,
          SMALL_SCREEN && {
            fontSize: 16,
            fontWeight: '500',
          },
        ]}>{customMap.title || customMap.name} -
          ({customMap.source})</ListItem.Title>
        {!isInternetReachable
          && <ListItem.Subtitle style={{paddingTop: 5}}>({customMap.count} tiles)</ListItem.Subtitle>}
      </ListItem.Content>
      <SwitchWrapper onValueChange={val => setCustomMapSwitchValue(val, customMap)} value={customMap.isViewable}/>
    </ListItem>
  );

  const renderOfflineCustomMapItem = (customMap) => {
    return (
      <ListItem
        containerStyle={[
          SMALL_SCREEN && {
            minHeight: 50,
            paddingVertical: 15,
            paddingHorizontal: 20,
          },
        ]}
        key={customMap.id + 'OfflineCustomMapItem'}
        onPress={() => onSetBasemap(customMap)}
      >
        <ListItem.Content>
          <ListItem.Title style={[
            commonStyles.listItemTitle,
            SMALL_SCREEN && {
              fontSize: 16,
              fontWeight: '500',
            },
          ]}>
            {customMap.title || customMap.name || truncateText(customMap?.id, 16)} -
            ({customMap.customMapSource || customMap.source || customMap.sources['raster-tiles'].type})
          </ListItem.Title>
          {/*{!isInternetReachable && !isConnected*/}
          {/*  && <ListItem.Subtitle style={{paddingTop: 5}}>({customMap.count} tiles!!!)</ListItem.Subtitle>}*/}
        </ListItem.Content>
        {customMap.id === currentBasemap?.id && currentBasemap.sources[currentBasemap.id].tiles[0].includes('file:/')
          && <Icon color={themes.BLUE} name={'checkmark-outline'} type={'ionicon'}/>}
      </ListItem>
    );
  };

  const renderOfflineCustomMapsList = () => {
    const sectionTitle = 'Offline Custom Basemaps';
    // Read straight from the device-wide offline store so downloaded maps show regardless of the loaded project.
    const offlineCustomMapsToDisplay = Object.values(offlineMaps).filter(
      offlineMap => !isDefaultMap(offlineMap) && !offlineMap.overlay);

    return (
      <View key={'OfflineCustomMapsList'}>
        <SectionDivider dividerText={sectionTitle}/>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={`No ${sectionTitle}`}/>}
          data={offlineCustomMapsToDisplay}
          keyExtractor={item => item.id + 'OfflineCustomMap'}
          renderItem={({item}) => renderOfflineCustomMapItem(item)}
        />
      </View>
    );
  };

  const renderOfflineCustomOverlaysList = () => {
    const sectionTitle = 'Offline Custom Overlays';
    // Overlays render only from their online tile URL (CustomOverlayLayer/buildTileURL) and their switch is driven by
    // the loaded project's customMaps, so offline overlays stay project-scoped here — unlike basemaps, which use local
    // file tiles and are listed device-wide above.
    const offlineCustomOverlaysToDisplay = getCustomOverlaysWithValidSources(customMaps).filter(
      customOverlay => offlineMaps[customOverlay.id]);

    return (
      <View key={'OfflineCustomOverlaysList'}>
        <SectionDivider dividerText={sectionTitle}/>
        <FlatList
          ListEmptyComponent={<ListEmptyText text={`No ${sectionTitle}`}/>}
          data={offlineCustomOverlaysToDisplay}
          keyExtractor={item => item.id + 'OfflineCustomOverlay'}
          renderItem={({item}) => renderMapOverlayItem(item)}
        />
      </View>
    );
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={onTouchOutside}
      fullscreen={SMALL_SCREEN}
      headerTitle={dialogTitle}
      isVisible={visible}
      onBackdropPress={onTouchOutside}
      overlayStyleOverride={overlayStyle}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={SMALL_SCREEN}
    >
      <FlatList
        ListHeaderComponent={
          <>
            {renderDefaultBasemapsList()}
            {determineWhatCustomMapListToRender()}
          </>
        }
        contentContainerStyle={{
          paddingVertical: SMALL_SCREEN ? 20 : 0,
          flexGrow: SMALL_SCREEN ? 1 : 0,
        }}
        style={{width: '100%'}}
      />
    </ModalWrapper>
  );
};

export default MapLayersOverlay;
