import {PixelRatio, Platform} from 'react-native';

import * as turf from '@turf/turf';

import useMapFeaturesCalculated from './features/useMapFeaturesCalculated';
import {isEmpty} from '../../shared/helpers';

const useMapMeasure = (mapRef) => {
  /* Data Hooks */

  const {getRandomFeatureInBBox} = useMapFeaturesCalculated(mapRef);

  /* Exported Functions */

  const getMeasureFeatures = async (e, measureFeaturesTemp, setDistance) => {
    let distance;
    const [screenPointX, screenPointY] = Platform.OS === 'web' ? [e.point.x, e.point.y]
      : Platform.OS === 'android' ? [e.properties.screenPointX / PixelRatio.get(), e.properties.screenPointY / PixelRatio.get()]
        : [e.properties.screenPointX, e.properties.screenPointY];

    // Used to draw a line between points
    const linestring = {'type': 'Feature', 'geometry': {'type': 'LineString', 'coordinates': []}};

    const featureAtPoint = await getRandomFeatureInBBox([screenPointX, screenPointY], ['measureLayerPoints']);
    // console.log('Feature at pressed point:', featureAtPoint);

    // Remove the linestring from the group so that we can redraw it based on points collection.
    if (measureFeaturesTemp.length > 1) measureFeaturesTemp.pop();

    // If a feature was clicked, remove it from the map.
    if (!isEmpty(featureAtPoint)) {
      const id = featureAtPoint.properties.id;
      measureFeaturesTemp = measureFeaturesTemp.filter(point => point.properties.id !== id);
    }
    else {
      const measureCoord = Platform.OS === 'web' ? [e.lngLat.lng, e.lngLat.lat] : turf.getCoord(e);
      const point = {
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': measureCoord,
        },
        'properties': {
          'id': String(new Date().getTime()),
        },
      };
      measureFeaturesTemp.push(point);
    }

    if (measureFeaturesTemp.length > 1) {
      linestring.geometry.coordinates = measureFeaturesTemp.map(point => point.geometry.coordinates);
      measureFeaturesTemp.push(linestring);

      distance = turf.length(linestring);
      setDistance(distance);
      // console.log(`Total distance: ${distance.toLocaleString()}km`);
    }
    // console.log('Measure Features', measureFeaturesTemp);

    return measureFeaturesTemp;
  };

  return {
    getMeasureFeatures,
  };
};

export default useMapMeasure;
