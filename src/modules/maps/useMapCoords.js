import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import {
  convertFeatureGeometryToImagePixels,
  convertImagePixelsToLatLong,
  getBBoxPaddedInPixels,
  getBoundsPadded,
  getCoordQuad,
} from './maps.helpers';
import {STRABO_APIS} from '../../services/network/urls.constants';
import useServerRequests from '../../services/network/useServerRequests';
import {isEmpty} from '../../shared/Helpers';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../home/home.slice';

const useMapCoords = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline);
  const {isSelected, endpoint} = useSelector(state => state.connections.databaseEndpoint);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {getMyMapsBbox} = useServerRequests();

  /* Exported Functions */

  const getCentroidOfSelectedSpot = () => turf.getCoord(turf.centroid(selectedSpot));

  const getMyMapsBboxCoords = async (map) => {
    try {
      let myMapsBboxUrl = STRABO_APIS.MY_MAPS_BBOX;
      if (isOnline.isConnected && !map.bbox && map.source === 'strabospot_mymaps') {
        if (isSelected) {
          console.log(endpoint.replace('/db', '/geotiff/bbox/'));
          myMapsBboxUrl = endpoint.replace('/db', '/geotiff/bbox/');
        }
        const myMapsBbox = await getMyMapsBbox(myMapsBboxUrl + map.id);
        if (!isEmpty(myMapsBbox)) return myMapsBbox.data.bbox;
      }
    }
    catch (error) {
      console.error(error);
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Cannot retrieve map\'s bounding box'));
      dispatch(setIsErrorMessagesModalVisible(true));
    }
  };

  return {
    convertFeatureGeometryToImagePixels,
    convertImagePixelsToLatLong,
    getBBoxPaddedInPixels,
    getBoundsPadded,
    getCentroidOfSelectedSpot,
    getCoordQuad,
    getMyMapsBboxCoords,
  };
};

export default useMapCoords;
