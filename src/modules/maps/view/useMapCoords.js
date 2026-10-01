import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import {getBBoxPaddedInPixels, getBoundsPadded, getCoordQuad} from './view.helpers';
import {STRABO_APIS} from '../../../services/network/urls.constants';
import useServerRequests from '../../../services/network/useServerRequests';
import {isEmpty} from '../../../shared/helpers';
import useIsConnectionAvailable from '../../connections/useConnectionStatus';
import {openedMessageModal} from '../../home/home.slice';
import {CUSTOM_MAP_SOURCES} from '../custom-maps/customMaps.constants';
import {convertFeatureGeometryToImagePixels, convertImagePixelsToLatLong} from '../maps.helpers';

const useMapCoords = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {isSelected, endpoint} = useSelector(state => state.connections.databaseEndpoint);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const isConnectionAvailable = useIsConnectionAvailable();
  const {getMyMapsBbox} = useServerRequests();

  /* Exported Functions */

  const getCentroidOfSelectedSpot = () => turf.getCoord(turf.centroid(selectedSpot));

  // Only a My Maps map has an extent to ask for, and only until it has one. Nothing is returned when it cannot be
  // asked for, or does not come back, and the map is then saved and shown without one.
  const getMyMapsBboxCoords = async (map) => {
    if (!isConnectionAvailable || !isEmpty(map.bbox) || map.source !== CUSTOM_MAP_SOURCES.STRABO_MY_MAPS) return;
    // Only My Maps are served by a custom database endpoint
    const myMapsBboxUrl = isSelected ? endpoint.replace('/db', '/geotiff/bbox/') : STRABO_APIS.MY_MAPS_BBOX;
    try {
      const myMapsBboxResponse = await getMyMapsBbox(myMapsBboxUrl + map.id);
      const bbox = myMapsBboxResponse?.data?.bbox;
      // Read defensively and reported: a map with no extent still works, it just cannot be zoomed to and shows no
      // thumbnail of itself. Not told to the user, who has no way to supply one.
      if (isEmpty(bbox)) {
        console.warn(`No bounding box for map ${map.id} from ${myMapsBboxUrl}`, myMapsBboxResponse);
      }
      return bbox;
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
