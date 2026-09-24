import React, {useEffect, useState} from 'react';
import {Dimensions, FlatList, Platform, Pressable, Text, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/helpers';
import * as themes from '../../../shared/styles.constants';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import SectionDivider from '../../../shared/ui/SectionDivider';
import SliderBar from '../../../shared/ui/SliderBar';
import SwitchWrapper from '../../../shared/ui/SwitchWrapper';
import useIsConnectionAvailable from '../../connections/useConnectionStatus';
import {findCustomMap, getLiveCustomMaps, getOverlayOpacity} from '../../maps/custom-maps/customMaps.helpers';
import useCustomMap from '../../maps/custom-maps/useCustomMap';
import {BASEMAPS} from '../../maps/maps.constants';
import {getAttributionText, isDefaultMap} from '../../maps/maps.helpers';
import MapThumbnail from '../../maps/MapThumbnail';
import {clearedOfflineMapPreview} from '../../maps/offline-maps/offlineMaps.slice';
import useMapsOffline from '../../maps/offline-maps/useMapsOffline';
import useMap from '../../maps/useMap';

// Web has no local tile store, so offline maps are never listed and every basemap comes from its online tile URL.
const isWeb = Platform.OS === 'web';
const listItemStyle = {paddingHorizontal: 10, paddingVertical: 5};
const listSubtitle = 'Tap a map to use it as the basemap, or open its options to draw it over the basemap.';
const overlayStyle = {...overlayStyles.overlayMapMenuPosition, height: '80%'};
// Options take the width of the list rather than lining up under the map's name: there are only ever one map's
// worth open, so nothing is gained by indenting them, and the slider wants every pixel it can get.
// Web sets these apart differently: its small text is 10px against 14, and its switch is a plain checkbox, so
// the rows come out tighter than on a device and need the gap between the map and its options put back by hand.
const mapOptionsStyle = {
  paddingBottom: 10,
  paddingHorizontal: SMALL_SCREEN ? 20 : 10,
  paddingTop: isWeb ? 10 : 0,
};
const centerButtonStyle = {alignItems: 'center', flexDirection: 'row'};
const centerLabelStyle = {
  color: themes.PRIMARY_ACCENT_COLOR,
  fontSize: themes.SMALL_TEXT_SIZE,
  paddingLeft: 5,
};
const opacityRowStyle = {alignItems: 'center', flexDirection: 'row', paddingTop: isWeb ? 2 : 8};
const optionsRowStyle = {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'};
const overlayGroupStyle = {alignItems: 'center', flexDirection: 'row'};
const overlayLabelStyle = {paddingRight: 8};
const sliderStyle = {flex: 1, paddingLeft: 10};
const overlayStatusStyle = {paddingRight: 5};
const subtitleStyle = {paddingTop: 5};
const smallScreenItemStyle = SMALL_SCREEN && {minHeight: 50, paddingHorizontal: 20, paddingVertical: 8};
const smallScreenTitleStyle = SMALL_SCREEN && {fontSize: 16, fontWeight: '500'};
// ListItem.Content lays its children out with alignItems flex-start, which sizes a title to its own text rather
// than to the row. Without a width to fill there is nothing for numberOfLines to trim against, so a long name
// runs on under the button beside it instead of ending in an ellipsis.
const titleStyle = {width: '100%'};
const attributionTextStyle = {
  color: themes.DARKGREY,
  fontSize: themes.SMALL_TEXT_SIZE,
  paddingBottom: 10,
  paddingHorizontal: 20,
  paddingTop: 20,
  textAlign: 'center',
};

const MapLayersOverlay = ({onTouchOutside, visible, zoomToCustomMap}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const customEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const customMaps = useSelector(state => state.map.customMaps);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);

  const isConnectionAvailable = useIsConnectionAvailable();

  const {setCustomMapOpacity, setCustomMapOverlay} = useCustomMap();
  const {setBasemap} = useMap();
  const {getMapTilesBbox, setOfflineMapTiles} = useMapsOffline();

  /* Local State */

  const [dialogTitle, setDialogTitle] = useState('Map Layers');
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  // Held only while a slider is being dragged, so the percentage keeps up with the thumb. The map is redrawn, and
  // the project written, when the drag ends rather than at every step of it.
  const [opacitiesBeingDragged, setOpacitiesBeingDragged] = useState({});
  // The one map whose options are open, so the list stays a list of maps rather than a stack of control panels
  const [optionsMapIdShown, setOptionsMapIdShown] = useState();

  /* Side Effects */

  useEffect(() => {
    if (customEndpoint.isSelected) setDialogTitle(`Map Layers - ${customEndpoint.endpoint}`);
  }, [customEndpoint.isSelected, customEndpoint.endpoint]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => setDimensions(window));
    return () => subscription?.remove();
  }, []);

  /* Event Handlers */

  const onOpacityDragged = (settingsMap, opacity) => {
    setOpacitiesBeingDragged({...opacitiesBeingDragged, [settingsMap.id]: opacity});
  };

  const onOpacityPicked = (settingsMap, opacity) => {
    setCustomMapOpacity(settingsMap, opacity);
    setOpacitiesBeingDragged({...opacitiesBeingDragged, [settingsMap.id]: undefined});
  };

  // Picking a map here ends any offline map preview, since both of these set a basemap of their own. A map cannot
  // be the basemap and an overlay at once, so it also stops being drawn over itself.
  const onSetBasemap = async (customMap, settingsMap) => {
    dispatch(clearedOfflineMapPreview());
    if (settingsMap.overlay) setCustomMapOverlay(settingsMap, false);
    if (isWeb || (isConnectionAvailable && customMap.url)) await setBasemap(customMap.id);
    else await setOfflineMapTiles(customMap);
  };

  // Moves the map without changing what is drawn on it, which is the one thing this menu could not do: choosing
  // what to show is already the row's job and the switch's. So it leaves a map switched on as an overlay exactly
  // that, rather than making it the basemap the way the same button does in Manage Custom Maps.
  const onCenterOnCustomMap = (customMap) => {
    zoomToCustomMap?.(customMap.bbox);
    SMALL_SCREEN && onTouchOutside();
  };

  // Offline, a map is only what was downloaded of it, so it is framed by its tiles rather than its stated
  // extent - which is the whole map, most of it blank here, and which a Mapbox style does not have at all.
  const onCenterOnOfflineMap = async (offlineMap) => {
    try {
      const bbox = await getMapTilesBbox(offlineMap.id);
      if (isEmpty(bbox)) return console.warn('No tiles found to center on for', offlineMap.id);
      onCenterOnCustomMap({bbox: bbox.join(',')});
    }
    catch (err) {
      console.error('Error centering on offline map', err);
    }
  };

  const onToggleOptionsShown = (settingsMap) => {
    setOptionsMapIdShown(optionsMapIdShown === settingsMap.id ? undefined : settingsMap.id);
  };

  const onToggleOverlay = async (customMap, settingsMap, isOverlayOn) => {
    // Turning a map on as an overlay hands the basemap back to the default one, since it cannot be both
    if (isOverlayOn && isCurrentBasemap(customMap)) {
      dispatch(clearedOfflineMapPreview());
      await setBasemap(null);
    }
    setCustomMapOverlay(settingsMap, isOverlayOn);
  };

  /* Logic Helpers */

  const isCurrentBasemap = map => !!currentBasemap?.id && map.id === currentBasemap.id;

  const setMap = async (map) => {
    dispatch(clearedOfflineMapPreview());
    await setBasemap(map.id);
    SMALL_SCREEN && onTouchOutside();
  };

  /* Render Functions */

  // Tapped to become the basemap, or switched on to be drawn over whichever basemap is showing. A map downloaded
  // under another project is not in the project, so its overlay settings are kept on the downloaded copy instead.
  const renderCustomMapItem = (customMap, isOffline) => {
    const settingsMap = isOffline ? findCustomMap(customMaps, customMap) || customMap : customMap;
    const isOverlayOn = !!settingsMap.overlay && !!settingsMap.isViewable;
    const isOptionsShown = optionsMapIdShown === settingsMap.id;
    return (
      <View key={customMap.id + (isOffline ? 'OfflineCustomMapItem' : 'CustomMapItem')}>
        <ListItem
          containerStyle={[listItemStyle, smallScreenItemStyle]}
          onPress={() => onSetBasemap(customMap, settingsMap)}
        >
          <MapThumbnail isSelected={isCurrentBasemap(customMap)} map={customMap}/>
          <ListItem.Content>
            <ListItem.Title
              ellipsizeMode={'tail'}
              numberOfLines={2}
              style={[commonStyles.listItemTitle, smallScreenTitleStyle, titleStyle]}
            >
              {customMap.title || customMap.name || customMap?.id}
            </ListItem.Title>
            {isOffline && <ListItem.Subtitle style={subtitleStyle}>({customMap.count} tiles)</ListItem.Subtitle>}
          </ListItem.Content>
          {/* Status rather than a control: an overlay left on is drawn on the map whether its options are open
           or not, and the row no longer keeps the switch that used to say so by being on. In the row and not
           under the name, where it would cost a third line under a title already allowed two. */}
          {isOverlayOn && (
            <Icon
              accessibilityLabel={'This map is drawn over the basemap'}
              color={themes.PRIMARY_ACCENT_COLOR}
              containerStyle={overlayStatusStyle}
              name={'layers'}
              size={20}
              type={'ionicon'}
            />
          )}
          {/* One button in the row instead of the three that used to be, so a map's name has the row to itself.
           What those three did is no narrower on a small screen, which is where the name lost most. */}
          <Icon
            accessibilityLabel={isOptionsShown ? 'Hide this map\'s options' : 'Show this map\'s options'}
            color={themes.PRIMARY_ACCENT_COLOR}
            name={isOptionsShown ? 'chevron-up-outline' : 'chevron-down-outline'}
            onPress={() => onToggleOptionsShown(settingsMap)}
            type={'ionicon'}
          />
        </ListItem>
        {isOptionsShown && renderMapOptions(customMap, settingsMap, isOverlayOn, isOffline)}
      </View>
    );
  };

  // Downloaded maps stand in for the live ones only when there is nothing to serve those: web has no local tile
  // store, and while the tiles can be reached, picking a downloaded map would show its tiles with nothing saying
  // so. Previewing from Manage Offline Maps is that, with a label, and it reads the same device-wide store, so a
  // map downloaded under another project is still reachable.
  const renderCustomMapListForConnection = () => isWeb || isConnectionAvailable ? renderCustomMapsList()
    : renderOfflineCustomMapsList();

  // Credit for the maps listed and for the tiles drawn beside their names. The map's own attribution control
  // speaks only for the map being rendered, and the thumbnails here include tiles bundled with the app.
  const renderAttribution = () => {
    const attributionText = getAttributionText(
      [...BASEMAPS, ...getLiveCustomMaps(customMaps), ...Object.values(offlineMaps)]);
    return !!attributionText && <Text style={attributionTextStyle}>{attributionText}</Text>;
  };

  const renderCustomMapsList = () => {
    const sectionTitle = 'Custom Maps';
    const customMapsToDisplay = getLiveCustomMaps(customMaps).filter(
      customMap => customEndpoint.isSelected ? customMap.url[0].includes('192.') : !customMap.url[0].includes('192.'));

    return (
      <View key={'CustomMapsList'}>
        <SectionDivider dividerText={sectionTitle} subtitle={listSubtitle}/>
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

  const renderDefaultBasemapsList = () => {
    let sectionTitle = 'Default Basemaps';
    let mapsToDisplay = BASEMAPS;
    if (!isWeb && !isConnectionAvailable) {
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

  const renderDefaultMapItem = (map) => {
    const onDefaultMapPressed = () => (isWeb || isConnectionAvailable) ? setMap(map) : setOfflineMapTiles(map);
    return (
      <ListItem
        containerStyle={[listItemStyle, smallScreenItemStyle]}
        key={map.id + 'DefaultMapItem'}
        onPress={onDefaultMapPressed}
      >
        <MapThumbnail isSelected={isCurrentBasemap(map)} map={map}/>
        <ListItem.Content>
          <ListItem.Title
            ellipsizeMode={'tail'}
            numberOfLines={1}
            style={[commonStyles.listItemTitle, smallScreenTitleStyle, titleStyle]}
          >
            {map.title || map.name}
          </ListItem.Title>
          {!isConnectionAvailable
            && <ListItem.Subtitle style={{paddingTop: 5}}>({map.count} tiles)</ListItem.Subtitle>}
        </ListItem.Content>
        {/* Only offline, where a default basemap is its downloaded tiles and so has an area to go to. Online it
         covers the world, and there is nowhere in particular to center on. */}
        {!isWeb && !isConnectionAvailable && map.count > 0 && (
          <Icon
            accessibilityLabel={'Center on map'}
            color={themes.PRIMARY_ACCENT_COLOR}
            name={'map-search-outline'}
            onPress={() => onCenterOnOfflineMap(map)}
            type={'material-community'}
          />
        )}
      </ListItem>
    );
  };

  const renderOfflineCustomMapsList = () => {
    const sectionTitle = 'Offline Custom Maps';
    // Read straight from the device-wide offline store so downloaded maps show regardless of the loaded project.
    const offlineCustomMapsToDisplay = Object.values(offlineMaps).filter(offlineMap => !isDefaultMap(offlineMap));

    return (
      <View key={'OfflineCustomMapsList'}>
        <SectionDivider dividerText={sectionTitle} subtitle={listSubtitle}/>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={`No ${sectionTitle}`}/>}
          data={offlineCustomMapsToDisplay}
          keyExtractor={item => item.id + 'OfflineCustomMap'}
          renderItem={({item}) => renderCustomMapItem(item, true)}
        />
      </View>
    );
  };

  // Everything a map can be told to do, opened under the map it belongs to and indented past its thumbnail. Only
  // one map's options are open at a time, which is what lets the opacity slider simply be here when the overlay
  // is on: the list cannot become a wall of sliders, so the slider needs no button of its own to sit behind.
  const renderMapOptions = (customMap, settingsMap, isOverlayOn, isOffline) => (
    <View style={mapOptionsStyle}>
      <View style={optionsRowStyle}>
        <View style={overlayGroupStyle}>
          <Text style={[commonStyles.listItemSubtitle, overlayLabelStyle]}>Overlay</Text>
          <SwitchWrapper
            accessibilityLabel={'Draw this map over the basemap'}
            onValueChange={val => onToggleOverlay(customMap, settingsMap, val)}
            value={isOverlayOn}
          />
        </View>
        {/* Only where there is somewhere to go: a map states its extent, a Mapbox style covers the world and has
         none, so a map that cannot be centered on carries no button that would do nothing. Named now that it
         is out of the row, where the icon had to say it alone. A downloaded map always has somewhere: its tiles. */}
        {(isOffline ? customMap.count > 0 : !isEmpty(customMap.bbox)) && (
          <Pressable
            accessibilityRole={'button'}
            onPress={() => (isOffline ? onCenterOnOfflineMap(customMap) : onCenterOnCustomMap(customMap))}
            style={centerButtonStyle}
          >
            <Icon
              color={themes.PRIMARY_ACCENT_COLOR}
              name={'map-search-outline'}
              size={20}
              type={'material-community'}
            />
            <Text style={centerLabelStyle}>Center on Map</Text>
          </Pressable>
        )}
      </View>
      {isOverlayOn && renderOpacityRow(settingsMap)}
    </View>
  );

  const renderOpacityRow = (settingsMap) => {
    const opacity = opacitiesBeingDragged[settingsMap.id] ?? getOverlayOpacity(settingsMap);
    return (
      <View style={opacityRowStyle}>
        <Text style={commonStyles.listItemSubtitle}>Opacity {Math.round(opacity * 100)}%</Text>
        <View style={sliderStyle}>
          <SliderBar
            isHideLabels
            maximumValue={1}
            minimumValue={0.05}
            onSlidingComplete={val => onOpacityPicked(settingsMap, val)}
            onValueChange={val => onOpacityDragged(settingsMap, val)}
            step={0.05}
            value={opacity}
          />
        </View>
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
        ListFooterComponent={renderAttribution()}
        ListHeaderComponent={
          <>
            {renderDefaultBasemapsList()}
            {renderCustomMapListForConnection()}
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
