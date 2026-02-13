import {useDispatch, useSelector} from 'react-redux';

import {BASEMAPS, MAP_MODES} from './maps.constants';
import {setCurrentBasemap} from './maps.slice';
import useMapCoords from './useMapCoords';
import useMapURL from './useMapURL';
import {STRABO_APIS} from '../../services/urls.constants';
import useServerRequests from '../../services/useServerRequests';
import {
  addedStatusMessage,
  clearedStatusMessages,
  setIsErrorMessagesModalVisible,
  setIsOfflineMapsModalVisible,
} from '../home/home.slice';

const useMap = () => {
  const dispatch = useDispatch();
  const customDatabaseEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const customMaps = useSelector(state => state.map.customMaps);

  const {getMyMapsBboxCoords} = useMapCoords();
  const {buildStyleURL} = useMapURL();
  const {getTileBaseUrl} = useServerRequests();

  const getExtentAndZoomCall = (extentString, zoomLevel) => {
    let url = getTileBaseUrl();
    url = customDatabaseEndpoint.isSelected ? url + '/zipcount' : STRABO_APIS.TILE_COUNT;
    console.log(url + '?extent=' + extentString + '&zoom=' + zoomLevel);
    return url + '?extent=' + extentString + '&zoom=' + zoomLevel;
  };

  const handleError = (message, err) => {
    dispatch(clearedStatusMessages());
    dispatch(addedStatusMessage(`${message} \n\n${err}`));
    dispatch(setIsOfflineMapsModalVisible(false));
    dispatch(setIsErrorMessagesModalVisible(true));
  };

  const isDrawMode = mode => Object.values(MAP_MODES.DRAW).includes(mode);

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
          dispatch(clearedStatusMessages());
          dispatch(addedStatusMessage(`Map ${mapId} not found. Setting basemap to Mapbox Topo.`));
          dispatch(setIsErrorMessagesModalVisible(true));
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
    handleError,
    isDrawMode,
    setBasemap,
  };
};

export default useMap;
