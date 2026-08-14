import React, {useEffect, useState} from 'react';
import {Dimensions, Platform, SectionList} from 'react-native';

import {ButtonGroup, Icon, ListItem} from '@rn-vui/base';
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
import {getMapTypeName} from '../../maps/custom-maps/customMaps.helpers';
import useCustomMap from '../../maps/custom-maps/useCustomMap';
import {BASEMAPS, DEFAULT_MAPS} from '../../maps/maps.constants';
import useMapsOffline from '../../maps/offline-maps/useMapsOffline';
import useMap from '../../maps/useMap';
import {getCustomMapsWithValidSources, getCustomOverlaysWithValidSources} from '../home.helpers';

// Web has no local tile store, so offline maps are never listed and every basemap comes from its online tile URL.
const isWeb = Platform.OS === 'web';
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

  const [activeTabIndex, setActiveTabIndex] = useState(0);
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
    if (isWeb || (isConnected && customMap.url)) await setBasemap(customMap.id);
    else await setOfflineMapTiles(customMap);
  };

  /* Logic Helpers */

  const isDefaultMap = map => DEFAULT_MAPS.some(defaultMap => defaultMap.id === map.id);

  // Filters custom maps/overlays to the maps served by the active endpoint (custom endpoints live on a 192.* host).
  const matchesEndpoint = customMap => customEndpoint.isSelected
    ? customMap.url[0].includes('192.') : !customMap.url[0].includes('192.');

  // Builds the connectivity-aware section list. Each section carries its own row renderer, and section data is tagged
  // with a unique _key prefix so ids that repeat across sections (e.g. a downloaded custom basemap) stay unique in the
  // single SectionList.
  const getSections = () => {
    const sections = [];

    let defaultTitle = 'Default Basemaps';
    let defaultData = BASEMAPS;
    if (!isInternetReachable && !isConnected) {
      defaultData = Object.values(offlineMaps).reduce((acc, offlineMap) => {
        return offlineMap.id === 'mapbox.outdoors' || offlineMap.id === 'mapbox.satellite' || offlineMap.id === 'osm'
        || offlineMap.id === 'macrostrat' || offlineMap.id === 'usgs.hillshade'
          ? [...acc, offlineMap]
          : acc;
      }, []);
      defaultTitle = 'Offline Default Basemaps';
    }
    sections.push({data: defaultData, renderRow: renderDefaultMapItem, title: defaultTitle, type: 'basemap'});

    const customBasemaps = {
      data: getCustomMapsWithValidSources(customMaps).filter(matchesEndpoint),
      renderRow: renderCustomMapItem,
      title: 'Custom Basemaps',
      type: 'basemap',
    };
    const offlineCustomBasemaps = {
      // Read straight from the device-wide offline store so downloaded maps show regardless of the loaded project.
      data: Object.values(offlineMaps).filter(offlineMap => !isDefaultMap(offlineMap) && !offlineMap.overlay),
      renderRow: renderOfflineCustomMapItem,
      title: 'Offline Custom Basemaps',
      type: 'basemap',
    };
    const customOverlays = {
      data: getCustomOverlaysWithValidSources(customMaps).filter(matchesEndpoint),
      renderRow: renderMapOverlayItem,
      title: 'Custom Overlays',
      type: 'overlay',
    };
    const offlineCustomOverlays = {
      // Overlays render only from their online tile URL (CustomOverlayLayer/buildTileURL) and their switch is driven by
      // the loaded project's customMaps, so offline overlays stay project-scoped here — unlike basemaps, which use local
      // file tiles and are listed device-wide above.
      data: getCustomOverlaysWithValidSources(customMaps).filter(customOverlay => offlineMaps[customOverlay.id]),
      renderRow: renderMapOverlayItem,
      title: 'Offline Custom Overlays',
      type: 'overlay',
    };

    // Offline basemaps are listed even when online so downloaded maps stay selectable regardless of the project.
    if (isWeb) sections.push(customBasemaps, customOverlays);
    else if (isInternetReachable && isConnected) sections.push(customBasemaps, offlineCustomBasemaps, customOverlays);
    else if (!isInternetReachable && isConnected) {
      sections.push(customBasemaps, offlineCustomBasemaps, customOverlays, offlineCustomOverlays);
    }
    else sections.push(offlineCustomBasemaps, offlineCustomOverlays);

    return sections.map(section => ({
      ...section,
      data: section.data.map(item => ({...item, _key: `${section.title}-${item.id}`})),
    }));
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
            {customMap.title || customMap.name || truncateText(customMap?.id, 16)}</ListItem.Title>
          <ListItem.Subtitle style={{paddingTop: 5, fontSize: themes.SMALL_TEXT_SIZE}}>{getMapTypeName(
            customMap.source)}</ListItem.Subtitle>
        </ListItem.Content>
        {customMap.id === currentBasemap?.id && <Icon color={themes.BLUE} name={'checkmark-outline'} type={'ionicon'}/>}
      </ListItem>
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
      onPress={() => (isWeb || isInternetReachable) ? setMap(map) : setOfflineMapTiles(map)}
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

  /* View */

  const activeType = activeTabIndex === 0 ? 'basemap' : 'overlay';
  const visibleSections = getSections().filter(section => section.type === activeType);

  return (
    <ModalWrapper
      closeModal={onTouchOutside}
      fullscreen={SMALL_SCREEN}
      headerTitle={dialogTitle}
      isChildrenFilled
      isVisible={visible}
      onBackdropPress={onTouchOutside}
      overlayStyleOverride={overlayStyle}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={SMALL_SCREEN}
    >
      <ButtonGroup
        buttons={['Basemaps', 'Overlays']}
        containerStyle={{marginHorizontal: 10, marginTop: 10}}
        onPress={setActiveTabIndex}
        selectedButtonStyle={{backgroundColor: themes.PRIMARY_ACCENT_COLOR}}
        selectedIndex={activeTabIndex}
        textStyle={{color: themes.PRIMARY_ACCENT_COLOR, fontSize: themes.SMALL_TEXT_SIZE}}
      />
      <SectionList
        ItemSeparatorComponent={FlatListItemSeparator}
        contentContainerStyle={{
          flexGrow: SMALL_SCREEN ? 1 : 0,
          paddingVertical: SMALL_SCREEN ? 20 : 0,
        }}
        keyExtractor={item => item._key}
        renderItem={({item, section}) => section.renderRow(item)}
        renderSectionFooter={({section}) => section.data.length === 0
          ? <ListEmptyText text={`No ${section.title}`}/> : null}
        renderSectionHeader={({section}) => <SectionDivider dividerText={section.title}/>}
        sections={visibleSections}
        stickySectionHeadersEnabled={false}
        style={{flex: 1, width: '100%'}}
      />
    </ModalWrapper>
  );
};

export default MapLayersOverlay;
