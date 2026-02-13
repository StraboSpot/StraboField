import {Platform} from 'react-native';

import * as turf from '@turf/turf';
import proj4 from 'proj4';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {
  GEO_LAT_LNG_PROJECTION,
  LATITUDE,
  LONGITUDE,
  PIXEL_PROJECTION,
  STRAT_SECTION_CENTER,
  ZOOM,
  ZOOM_STRAT_SECTION,
} from './maps.constants';
import {setCenter, setZoom} from './maps.slice';
import useMapCoords from './useMapCoords';
import {isEmpty, isEqual} from '../../shared/Helpers';

const useMapView = () => {
  const dispatch = useDispatch();
  const center = useSelector(state => state.map.center);
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const stratSection = useSelector(state => state.map.stratSection);
  const zoom = useSelector(state => state.map.zoom);

  const toast = useToast();
  const {convertImagePixelsToLatLong, getBoundsPadded} = useMapCoords();

  /* Internal Functions */

  const isOnImageBasemap = feature => feature.properties?.image_basemap;

  const isOnStratSection = feature => feature.properties?.strat_section_id;

  /* Exported Functions */

  // Evaluate and return appropriate center coordinates
  const getCenterCoordinates = () => {
    // console.log('Getting initial map center...', center);
    if (currentImageBasemap || stratSection) {
      if ((selectedSpot?.properties?.image_basemap && selectedSpot?.properties.image_basemap === currentImageBasemap?.id)
        || (selectedSpot?.properties?.strat_section_id && selectedSpot?.properties.strat_section_id === stratSection?.strat_section_id)
        && selectedSpot.geometry?.coordinates) {
        return proj4(PIXEL_PROJECTION, GEO_LAT_LNG_PROJECTION, turf.centroid(selectedSpot).geometry.coordinates);
      }
      if (currentImageBasemap && currentImageBasemap.width && currentImageBasemap.height) {
        return proj4(PIXEL_PROJECTION, GEO_LAT_LNG_PROJECTION,
          [(currentImageBasemap.width) / 2, (currentImageBasemap.height) / 2]);
      }
      else if (stratSection) return STRAT_SECTION_CENTER;
    }
    else if (!isEmpty(center)) return center;
    return [LONGITUDE, LATITUDE];  // ToDo Zoom to Extent of Spots if no saved center
  };

  // Set initial center and zoom
  const getInitialViewState = () => {
    const initialCenter = getCenterCoordinates();
    const initialZoom = getZoomLevel();

    const initialViewState = {
      longitude: initialCenter[0],
      latitude: initialCenter[1],
      zoom: initialZoom,
    };

    // console.log('Setting Initial View State', initialViewState);
    return initialViewState;
  };

  const getZoomLevel = () => {
    // console.log('Getting initial zoom...', zoom);
    if (currentImageBasemap) return ZOOM;
    else if (stratSection) return ZOOM_STRAT_SECTION;
    return zoom;
  };

  // If feature is mapped on geographical map, not an image basemap or strat section
  const isOnGeoMap = (feature) => {
    if (isEmpty(feature)) return false;
    return !feature.properties.image_basemap && !feature.properties.strat_section_id;
  };

  const setMapView = (newCenter, newZoom) => {
    if (!isEqual(center, newCenter)) dispatch(setCenter(newCenter));
    if (zoom !== newZoom) dispatch(setZoom(newZoom));
  };

  const zoomToSpotsNow = async (spotsToZoomTo, map, camera) => {
    if (spotsToZoomTo.length === 0) {
      console.log('No Spots to Zoom to');
      toast.show('No Spots to Zoom to');
    }
    else if (spotsToZoomTo.every(s => isOnGeoMap(s)) || spotsToZoomTo.every(s => isOnImageBasemap(s))
      || spotsToZoomTo.every(s => isOnStratSection(s))) {
      if (camera || Platform.OS === 'web') {
        try {
          console.log('spotsToZoomTo[0]', spotsToZoomTo[0]);
          if (isOnImageBasemap(spotsToZoomTo[0]) || isOnStratSection(spotsToZoomTo[0])) {
            const spotsCopy = JSON.parse(JSON.stringify(spotsToZoomTo));
            spotsToZoomTo = spotsCopy.map(spot => convertImagePixelsToLatLong(spot));
            console.log('spotsToZoomToNew', spotsToZoomTo);
          }
          if (spotsToZoomTo.length === 1) {
            let centroidCoords = turf.getCoord(turf.centroid(spotsToZoomTo[0]));
            if (Platform.OS === 'web') {
              map.flyTo({center: centroidCoords, zoom: isOnStratSection(spotsToZoomTo[0]) ? ZOOM_STRAT_SECTION : ZOOM});
            }
            else {
              const [maxY, maxX, minY, minX] = getBoundsPadded(centroidCoords);
              camera.fitBounds([maxX, minY], [minX, maxY], 100, 2500);
            }
          }
          else {
            let featureCollection = turf.featureCollection(spotsToZoomTo);
            const [minX, minY, maxX, maxY] = turf.bbox(featureCollection);
            if (Platform.OS === 'web') map.fitBounds([[maxX, minY], [minX, maxY]], {padding: 100, duration: 2500});
            else camera.fitBounds([maxX, minY], [minX, maxY], 100, 2500);
          }
        }
        catch (err) {
          throw Error('Error Zooming To Extent of Spots', err);
        }
      }
      else throw Error('Error Getting Map Camera');
    }
    else throw Error('Error Zooming To Extent of Spots');
  };

  return {
    getCenterCoordinates,
    getInitialViewState,
    getZoomLevel,
    isOnGeoMap,
    setMapView,
    zoomToSpotsNow,
  };
};

export default useMapView;
