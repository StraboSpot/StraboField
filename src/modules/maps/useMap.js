import {useDispatch, useSelector, useStore} from 'react-redux';

import {BASEMAPS} from './maps.constants';
import {isDrawMode} from './maps.helpers';
import {setCurrentBasemap, updateCustomMap} from './maps.slice';
import useMapURL from './useMapURL';
import useMapCoords from './view/useMapCoords';
import {STRABO_APIS} from '../../services/network/urls.constants';
import useServerRequests from '../../services/network/useServerRequests';
import {openedMessageModal} from '../home/home.slice';
import {updatedProject} from '../project/projects.slice';

const useMap = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const customDatabaseEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const customMaps = useSelector(state => state.map.customMaps);
  const store = useStore();

  const {getMyMapsBboxCoords} = useMapCoords();
  const {buildStyleURL} = useMapURL();
  const {getTileBaseUrl} = useServerRequests();

  /* Internal Functions */

  // An extent is fetched once and then kept with the map rather than only with this view of it. It is what zooming
  // to the map reads, and what its thumbnail is taken from, and the server need not be asked again on every use.
  // Written here rather than through useCustomMap's updateMap, which cannot be reached from this hook - useCustomMap
  // is the one that depends on this one. The maps are read from the store rather than from this render, since the
  // map layers list stores the extents of several maps at once and each would otherwise write the project's maps
  // back without the ones stored just before it.
  const storeCustomMapBbox = (mapId, bbox) => {
    const latestCustomMaps = store.getState().map.customMaps;
    const customMap = latestCustomMaps[mapId];
    if (!customMap || customMap.bbox === bbox) return;
    console.log('Storing bbox for custom map', mapId, bbox);
    const updatedCustomMap = {...customMap, bbox: bbox};
    dispatch(updateCustomMap(updatedCustomMap));
    dispatch(updatedProject(
      {field: 'other_maps', value: Object.values({...latestCustomMaps, [mapId]: updatedCustomMap})}));
  };

  /* Exported Functions */

  const getExtentAndZoomCall = (extentString, zoomLevel) => {
    let url = getTileBaseUrl();
    url = customDatabaseEndpoint.isSelected ? url + '/zipcount' : STRABO_APIS.TILE_COUNT;
    console.log(url + '?extent=' + extentString + '&zoom=' + zoomLevel);
    return url + '?extent=' + extentString + '&zoom=' + zoomLevel;
  };

  // The extent of a My Maps map that has none yet, fetched and kept without waiting for the map to be shown. Its
  // thumbnail is taken from it, and a map listed but never opened would otherwise show only its map type. Quiet, as
  // a list asks for every map in it at once. Mirrors setBasemap, which does not ask a custom database endpoint.
  const storeMissingCustomMapBbox = async (map) => {
    if (customDatabaseEndpoint.isSelected) return;
    const bbox = await getMyMapsBboxCoords(map, true);
    if (bbox) storeCustomMapBbox(map.id, bbox);
  };

  const setBasemap = async (mapId) => {
    try {
      let newBasemap;
      let bbox = '';
      if (!mapId) mapId = 'mapbox.outdoors';
      newBasemap = BASEMAPS.find(basemap => basemap.id === mapId);
      if (newBasemap === undefined) {
        newBasemap = await Object.values(customMaps).find((basemap) => {
          console.log(basemap);
          return basemap.id === mapId;
        });
        if (newBasemap) {
          const styleURLObj = buildStyleURL(newBasemap);
          console.log('Mapbox StyleURL for basemap', styleURLObj);
          newBasemap = {...newBasemap, ...styleURLObj};
          if (!customDatabaseEndpoint.isSelected) {
            bbox = await getMyMapsBboxCoords(newBasemap);
            if (bbox) {
              newBasemap = {...newBasemap, bbox: bbox};
              storeCustomMapBbox(mapId, bbox);
            }
          }
        }
        else {
          dispatch(openedMessageModal({
            message: `Map ${mapId} not found. Setting basemap to Mapbox Topo.`,
            title: 'Error!',
          }));
          await setBasemap(null);
        }
      }
      // console.log('Setting current basemap to a default basemap...');
      dispatch(setCurrentBasemap(newBasemap));
      return newBasemap;
    }
    catch (err) {
      console.warn('Error in setBasemap', err);
    }
  };

  return {
    getExtentAndZoomCall,
    isDrawMode,
    setBasemap,
    storeMissingCustomMapBbox,
  };
};

export default useMap;
