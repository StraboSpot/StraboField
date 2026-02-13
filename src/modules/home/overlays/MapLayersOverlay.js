import React, {useEffect, useState} from 'react';
import {Dimensions, FlatList, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {truncateText} from '../../../shared/Helpers';
import * as themes from '../../../shared/styles.constants';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import {SwitchWrapper} from '../../../shared/ui';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import SectionDivider from '../../../shared/ui/SectionDivider';
import useCustomMap from '../../maps/custom-maps/useCustomMap';
import {BASEMAPS} from '../../maps/maps.constants';
import useMapsOffline from '../../maps/offline-maps/useMapsOffline';
import useMap from '../../maps/useMap';

const MapLayersOverlay = ({onTouchOutside, visible}) => {
  const {setCustomMapSwitchValue} = useCustomMap();
  const {setBasemap} = useMap();
  const {setOfflineMapTiles} = useMapsOffline();

  const [dialogTitle, setDialogTitle] = useState('Map Layers');
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const customEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const customMaps = useSelector(state => state.map.customMaps);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const {isConnected, isInternetReachable} = useSelector(state => state.connections.isOnline);

  const overlayStyle = {...overlayStyles.overlayMapMenuPosition, height: '80%'};

  useEffect(() => {
    if (customEndpoint.isSelected) setDialogTitle(`Map Layers - ${customEndpoint.endpoint}`);
  }, [customEndpoint.isSelected, customEndpoint.endpoint]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

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

  const getCustomMapsWithValidSources = maps => Object.values(maps).filter(m => isValidSource(m) && !m.overlay);

  const getCustomOverlaysWithValidSources = maps => Object.values(maps).filter(m => isValidSource(m) && m.overlay);

  const isValidSource = map => map.source === 'mapbox_styles' || map.source === 'strabospot_mymaps';

  const onSetBasemap = async (customMap) => {
    if ((isInternetReachable && isConnected) || (!isInternetReachable && isConnected)) {
      if (!customMap.url) await setOfflineMapTiles(customMap);
      else await setBasemap(customMap.id);
    }
    else await setOfflineMapTiles(customMap);
  };

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
            ({customMap.source || customMap.sources['raster-tiles'].type})
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
    const offlineCustomMapsToDisplay = getCustomMapsWithValidSources(customMaps).filter(
      customMap => offlineMaps[customMap.id]);

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

  const setMap = async (map) => {
    await setBasemap(map.id);
    SMALL_SCREEN && onTouchOutside();
  };

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
