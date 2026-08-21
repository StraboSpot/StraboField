import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import {getBBoxPaddedInPixels, getBoundsPadded, getCoordQuad} from './view.helpers';
import {STRABO_APIS} from '../../../services/network/urls.constants';
import useServerRequests from '../../../services/network/useServerRequests';
import {isEmpty} from '../../../shared/helpers';
import {openedMessageModal} from '../../home/home.slice';
import {convertFeatureGeometryToImagePixels, convertImagePixelsToLatLong} from '../maps.helpers';

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
    let myMapsBboxUrl = STRABO_APIS.MY_MAPS_BBOX;
    try {
      if (isOnline.isConnected && !map.bbox && map.source === 'strabospot_mymaps') {
        if (isSelected) {
          console.log(endpoint.replace('/db', '/geotiff/bbox/'));
          myMapsBboxUrl = endpoint.replace('/db', '/geotiff/bbox/');
        }
        const myMapsBbox = await getMyMapsBbox(myMapsBboxUrl + map.id);
        if (!isEmpty(myMapsBbox)) return myMapsBbox.data.bbox;
      }
    }
    catch (err) {
      console.error(`Error getting the bounding box for map ${map?.id} (${map?.source}) from ${myMapsBboxUrl}`,
        err);
      dispatch(openedMessageModal({message: 'Cannot retrieve the bounding box for this map.', title: 'Error!'}));
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
