import {useDispatch, useSelector} from 'react-redux';

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

  const {getMyMapsBboxCoords} = useMapCoords();
  const {buildStyleURL} = useMapURL();
  const {getTileBaseUrl} = useServerRequests();

  /* Internal Functions */

  // An extent is fetched once and then kept with the map rather than only with this view of it. It is what zooming
  // to the map reads, and what its thumbnail is taken from, and the server need not be asked again on every use.
  // Written here rather than through useCustomMap's updateMap, which cannot be reached from this hook - useCustomMap
  // is the one that depends on this one.
  const storeCustomMapBbox = (mapId, bbox) => {
    const customMap = customMaps[mapId];
    if (!customMap || customMap.bbox === bbox) return;
    console.log('Storing bbox for custom map', mapId, bbox);
    const updatedCustomMap = {...customMap, bbox: bbox};
    dispatch(updateCustomMap(updatedCustomMap));
    dispatch(updatedProject(
      {field: 'other_maps', value: Object.values({...customMaps, [mapId]: updatedCustomMap})}));
  };

  /* Exported Functions */

  const getExtentAndZoomCall = (extentString, zoomLevel) => {
    let url = getTileBaseUrl();
    url = customDatabaseEndpoint.isSelected ? url + '/zipcount' : STRABO_APIS.TILE_COUNT;
    console.log(url + '?extent=' + extentString + '&zoom=' + zoomLevel);
    return url + '?extent=' + extentString + '&zoom=' + zoomLevel;
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
  };
};

export default useMap;
