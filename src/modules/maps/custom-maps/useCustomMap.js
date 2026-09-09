import {useDispatch, useSelector} from 'react-redux';

import {CUSTOM_MAP_SOURCES} from './customMaps.constants';
import {normalizeCustomMapId} from './customMaps.helpers';
import {STRABO_APIS} from '../../../services/network/urls.constants';
import useServerRequests from '../../../services/network/useServerRequests';
import {isEmpty} from '../../../shared/helpers';
import {SIDE_PANEL_VIEWS} from '../../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import {updatedProject} from '../../project/projects.slice';
import {MAP_PROVIDERS} from '../maps.constants';
import {
  addedCustomMap,
  deletedCustomMap,
  selectedCustomMapToEdit,
  setCurrentBasemap,
  updateCustomMap,
} from '../maps.slice';
import useMapsOffline from '../offline-maps/useMapsOffline';
import useMap from '../useMap';
import useMapURL from '../useMapURL';
import useMapCoords from '../view/useMapCoords';

const useCustomMap = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const customDatabaseEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const customMaps = useSelector(state => state.map.customMaps);
  const project = useSelector(state => state.project.project);

  const {setBasemap} = useMap();
  const {getMyMapsBboxCoords} = useMapCoords();
  const {renameOfflineMapTiles} = useMapsOffline();
  const {buildStyleURL, buildTileURL} = useMapURL();
  const {testCustomMapUrl, getMyMapsBbox} = useServerRequests();

  /* Internal Functions */

  const getProviderInfo = (source) => {
    const providerInfo = {...MAP_PROVIDERS[source]};
    // Only My Maps are served by a custom database endpoint; Mapbox styles must keep pointing at api.mapbox.com.
    if (customDatabaseEndpoint.isSelected && source === CUSTOM_MAP_SOURCES.STRABO_MY_MAPS) {
      const serverUrl = customDatabaseEndpoint.endpoint;
      const lastOccur = serverUrl.lastIndexOf('/');
      providerInfo.url = [serverUrl.substring(0, lastOccur) + '/geotiff/tiles/'];
    }
    return providerInfo;
  };

  const viewCustomMap = (map) => {
    console.log('Setting current basemap to a custom basemap...');
    dispatch(setCurrentBasemap(map));
  };

  /* Exported Functions */

  const deleteMap = async (mapId) => {
    console.log('Deleting Custom Map:', mapId);
    const projectCopy = {...project};
    const customMapsCopy = {...customMaps};
    delete customMapsCopy[mapId];
    if (projectCopy.other_maps) {
      const filteredCustomMaps = projectCopy.other_maps.filter(map => map.id !== mapId);
      dispatch(updatedProject({field: 'other_maps', value: filteredCustomMaps})); // Deletes map from project
    }
    dispatch(deletedCustomMap(customMapsCopy)); // replaces customMaps with updated object
    dispatch(setSidePanelVisible({bool: false}));
  };

  const getCustomMapDetails = (map) => {
    dispatch(selectedCustomMapToEdit(map));
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.MANAGE_CUSTOM_MAP}));
  };

  const getMyMapsBBox = async (mapId) => {
    if (customDatabaseEndpoint.isSelected) {
      console.log('My Maps Bbox Endpoint:', customDatabaseEndpoint.endpoint.replace('/db', '/geotiff/bbox/' + mapId));
      const bboxEndpoint = customDatabaseEndpoint.endpoint.replace('/db', '/geotiff/bbox/' + mapId);
      const response = await getMyMapsBbox(bboxEndpoint);
      console.log('My Maps Bbox Response:', response);
    }
    const response = await getMyMapsBbox(STRABO_APIS.MY_MAPS_BBOX + mapId);
    console.log('My Maps Bbox Response:', response);
  };

  // `previousId` is passed when editing an existing map's id — e.g. a shared Mapbox style re-created under the
  // current user's own account, which gets a new id that their token can actually read.
  const saveCustomMap = async (map, previousId) => {
    const mapId = normalizeCustomMapId(map.id, map.source);
    const isIdChanged = !!previousId && previousId !== mapId;
    const providerInfo = getProviderInfo(map.source);
    // A changed id points at a different source map, so drop the stored extent rather than carrying it over — an
    // empty bbox is also what makes getMyMapsBboxCoords go and fetch the new one.
    const customMap = {...map, ...providerInfo, id: mapId, source: map.source, ...(isIdChanged && {bbox: ''})};
    const tileUrl = buildTileURL(customMap);
    let testTileUrl = tileUrl.replace(/({z}\/{x}\/{y})/, '0/0/0');
    // Test against customMap.id, not map.id: normalizeCustomMapId trimmed it, and validating a different string
    // than the one being saved would let an id pasted with stray whitespace through.
    if (map.source === CUSTOM_MAP_SOURCES.STRABO_MY_MAPS) {
      if (!isEmpty(customDatabaseEndpoint.endpoint) && customDatabaseEndpoint.isSelected) {
        const customEndpointTest = customDatabaseEndpoint.endpoint.replace('/db', '/strabo_mymaps_check/');
        testTileUrl = customEndpointTest + customMap.id;
      }
      else testTileUrl = STRABO_APIS.MY_MAPS_CHECK + customMap.id;
    }
    console.log('Custom Map:', customMap, 'Test Tile URL:', testTileUrl);

    const testUrlResponse = await testCustomMapUrl(testTileUrl);
    console.log('Custom Map URL Test Response:', testUrlResponse);
    if (testUrlResponse) {
      const bbox = await getMyMapsBboxCoords(customMap);
      const savedCustomMap = bbox ? {...customMap, bbox: bbox} : customMap;
      // The map is the current basemap under whichever id it was saved as, so an id being edited has to match on
      // either one. currentBasemap is null until a map has been shown.
      const isCurrentBasemap = currentBasemap?.id === savedCustomMap.id
        || (isIdChanged && currentBasemap?.id === previousId);
      if (map.overlay && isCurrentBasemap) {
        console.log('Setting Basemap to Mapbox Topo...');
        await setBasemap(null);
      }
      if (project.other_maps) {
        const otherMapsInProject = project.other_maps;
        const otherMapsInProjectFiltered = otherMapsInProject.filter(
          m => m.id !== savedCustomMap.id && m.id !== previousId);
        dispatch(updatedProject(
          {field: 'other_maps', value: [...otherMapsInProjectFiltered, savedCustomMap]}));
      }
      else dispatch(updatedProject({field: 'other_maps', value: [savedCustomMap]}));
      // Drop the old key first — addedCustomMap merges, so it would otherwise leave the map listed under both ids.
      if (isIdChanged) {
        console.log('Custom Map id changed:', previousId, '->', savedCustomMap.id);
        const customMapsCopy = {...customMaps};
        delete customMapsCopy[previousId];
        dispatch(deletedCustomMap(customMapsCopy));
      }
      dispatch(addedCustomMap(savedCustomMap));
      if (isIdChanged) {
        await renameOfflineMapTiles(previousId, savedCustomMap);
        // Re-point the basemap directly: setBasemap looks the map up in this render's customMaps, which predates
        // the dispatch above and so would not find the new id. Skipped for an overlay, which just cleared the basemap.
        if (isCurrentBasemap && !savedCustomMap.overlay) {
          dispatch(setCurrentBasemap({...savedCustomMap, ...buildStyleURL(savedCustomMap)}));
        }
      }
      return savedCustomMap;
    }
    else throw (`${customMap.id} is not a valid ID for this map.  Please check the id and try again.`);
  };

  const setCustomMapSwitchValue = (value, map) => {
    console.log('Custom Map Switch Value:', value, 'Map Id:', map.id);
    if (customMaps[map.id]) {
      dispatch(addedCustomMap({...customMaps[map.id], isViewable: value}));
      if (value && !customMaps[map.id].overlay) viewCustomMap(map);
    }
  };

  const updateMap = (map) => {
    const customMapsCopy = {...customMaps};
    customMapsCopy[map.id] = map;
    console.log('Updated Custom Maps:', customMapsCopy);
    dispatch(updateCustomMap(map));
    dispatch(updatedProject({field: 'other_maps', value: Object.values(customMapsCopy)}));
  };

  return {
    deleteMap,
    getCustomMapDetails,
    getMyMapsBBox,
    saveCustomMap,
    setCustomMapSwitchValue,
    updateMap,
  };
};

export default useCustomMap;
