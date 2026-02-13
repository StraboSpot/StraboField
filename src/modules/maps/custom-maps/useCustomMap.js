import {useDispatch, useSelector} from 'react-redux';

import {STRABO_APIS} from '../../../services/urls.constants';
import useServerRequests from '../../../services/useServerRequests';
import {isEmpty} from '../../../shared/Helpers';
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
import useMap from '../useMap';
import useMapCoords from '../useMapCoords';
import useMapURL from '../useMapURL';

const useCustomMap = () => {
  const dispatch = useDispatch();
  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const customDatabaseEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const customMaps = useSelector(state => state.map.customMaps);
  const project = useSelector(state => state.project.project);

  const {setBasemap} = useMap();
  const {getMyMapsBboxCoords} = useMapCoords();
  const {buildTileURL} = useMapURL();
  const {testCustomMapUrl, getMyMapsBbox} = useServerRequests();

  /* Internal Functions */

  const getProviderInfo = (source) => {
    let providerInfo = {...MAP_PROVIDERS[source]};
    if (customDatabaseEndpoint.isSelected) {
      const serverUrl = customDatabaseEndpoint.endpoint;
      const lastOccur = serverUrl.lastIndexOf('/');
      providerInfo.url = [serverUrl.substring(0, lastOccur) + '/geotiff/tiles/'];
      return providerInfo;
    }
    console.log(providerInfo);
    return providerInfo;
  };

  const viewCustomMap = (map) => {
    console.log('Setting current basemap to a custom basemap...');
    dispatch(setCurrentBasemap(map));
  };

  /* Exported Functions */

  const deleteMap = async (mapId) => {
    console.log('Deleting Map Here');
    console.log('map: ', mapId);
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
      console.log(customDatabaseEndpoint.endpoint.replace('/db', '/geotiff/bbox/' + mapId));
      const bboxEndpoint = customDatabaseEndpoint.endpoint.replace('/db', '/geotiff/bbox/' + mapId);
      const response = await getMyMapsBbox(bboxEndpoint);
      console.log(response);
    }
    const response = await getMyMapsBbox(STRABO_APIS.MY_MAPS_BBOX + mapId);
    console.log(response);
  };

  const saveCustomMap = async (map) => {
    let mapId = map.id.trim();
    let customMap;
    const providerInfo = getProviderInfo(map.source);
    let bbox = '';
    // Pull out mapbox styles map id
    if (map.source === 'mapbox_styles' && map.id.includes('mapbox://styles/')) {
      mapId = map.id.split('/').slice(3).join('/');
    }
    customMap = {...map, ...providerInfo, id: mapId, source: map.source};
    const tileUrl = buildTileURL(customMap);
    let testTileUrl = tileUrl.replace(/({z}\/{x}\/{y})/, '0/0/0');
    if (map.source === 'strabospot_mymaps') {
      if (!isEmpty(customDatabaseEndpoint.endpoint) && customDatabaseEndpoint.isSelected) {
        const customEndpointTest = customDatabaseEndpoint.endpoint.replace('/db', '/strabo_mymaps_check/');
        testTileUrl = customEndpointTest + map.id;
      }
      else testTileUrl = STRABO_APIS.MY_MAPS_CHECK + map.id;

    }
    console.log('Custom Map:', customMap, 'Test Tile URL:', testTileUrl);

    const testUrlResponse = await testCustomMapUrl(testTileUrl);
    console.log('RES', testUrlResponse);
    if (testUrlResponse) {
      bbox = await getMyMapsBboxCoords(map);
      if (map.overlay && map.id === currentBasemap.id) {
        console.log(('Setting Basemap to Mapbox Topo...'));
        await setBasemap(null);
      }
      if (project.other_maps) {
        const otherMapsInProject = project.other_maps;
        const otherMapsInProjectFiltered = otherMapsInProject.filter(m => m.id !== customMap.id);
        // if (customMap.source !== 'mapbox_styles') delete customMap.key;
        dispatch(updatedProject(
          {field: 'other_maps', value: [...otherMapsInProjectFiltered, customMap]}));
      }
      else dispatch(updatedProject({field: 'other_maps', value: [map]}));
      dispatch(addedCustomMap(bbox ? {...customMap, bbox: bbox} : customMap));
      return customMap;
    }
    else throw (`${customMap.id} is not a valid ID for this map.  Please check the id and try again.`);
  };

  const setCustomMapSwitchValue = (value, map) => {
    console.log('Custom Map Switch Value:', value, 'Map Id:', map.id);
    if (customMaps[map.id]) {
      dispatch(addedCustomMap({...customMaps[map.id], isViewable: value}));
      if (!customMaps[map.id].overlay) viewCustomMap(map);
    }
  };

  const updateMap = (map) => {
    const customMapsCopy = {...customMaps};
    customMapsCopy[map.id] = map;
    console.log(customMapsCopy);
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
