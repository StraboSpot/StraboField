import {useDispatch, useSelector} from 'react-redux';

import {BASEMAPS} from './maps.constants';
import {isDrawMode} from './maps.helpers';
import {setCurrentBasemap} from './maps.slice';
import useMapURL from './useMapURL';
import useMapCoords from './view/useMapCoords';
import {STRABO_APIS} from '../../services/network/urls.constants';
import useServerRequests from '../../services/network/useServerRequests';
import {openedMessageModal} from '../home/home.slice';

const useMap = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const customDatabaseEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const customMaps = useSelector(state => state.map.customMaps);

  const {getMyMapsBboxCoords} = useMapCoords();
  const {buildStyleURL} = useMapURL();
  const {getTileBaseUrl} = useServerRequests();

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
            if (bbox) newBasemap = {...newBasemap, bbox: bbox};
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
