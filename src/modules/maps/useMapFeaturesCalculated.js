import {PixelRatio, Platform} from 'react-native';

import * as turf from '@turf/turf';
import {useSelector} from 'react-redux';

import useMapCoords from './useMapCoords';
import {isEmpty} from '../../shared/Helpers';
import useNesting from '../nesting/useNesting';
import {useSpots} from '../spots';

const useMapFeaturesCalculated = (mapRef) => {
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const stratSection = useSelector(state => state.map.stratSection);

  const {convertImagePixelsToLatLong, getBBoxPaddedInPixels} = useMapCoords();
  const {getChildrenGenerationsSpots} = useNesting();
  const {getSpotById, getSpotsByIds} = useSpots();

  const spotLayers = ['pointLayerNotSelected', 'lineLayerNotSelected', 'lineLayerNotSelectedDotted',
    'lineLayerNotSelectedDashed', 'lineLayerNotSelectedDotDashed', 'polygonLayerNotSelected',
    'polygonLayerWithPatternNotSelected', 'lineLayerSelected', 'lineLayerSelectedDotted',
    'lineLayerSelectedDashed', 'lineLayerSelectedDotDashed', 'polygonLayerSelected', 'polygonLayerWithPatternSelected'];

  const getClosestSpotDistanceAndIndex = (distancesFromSpot) => {
    let minDistance = Number.MAX_VALUE;
    let minIndex = -1;
    for (let j = 0; j < distancesFromSpot.length; j++) {
      if (minDistance > distancesFromSpot[j]) { // trying to get the minimum distance
        minDistance = distancesFromSpot[j];
        minIndex = j;
      } // else we can ignore that feature.
    }
    return [minDistance, minIndex];
  };

  const getDistancesFromSpot = async (screenPointX, screenPointY, featuresInRect) => {
    const dummyFeature = {
      'type': 'Feature',
      'properties': {},
      'geometry': {
        'type': 'Point',
        'coordinates': [screenPointX, screenPointY],
      },
    };
    const distances = [];
    let screenCoords = [];
    for (let i = 0; i < featuresInRect.length; i++) {
      if (featuresInRect[i].geometry.type === 'Polygon' || featuresInRect[i].geometry.type === 'LineString'
        || featuresInRect[i].geometry.type === 'MultiLineString' || featuresInRect[i].geometry.type === 'MultiPolygon') {
        // trying to get a distance that is closest from the vertices of a polygon or line
        // to the dummy feature with screenX and screenY
        const explodedFeatures = turf.explode(featuresInRect[i]);
        const explodedFeaturesDistancesFromSpot = await getDistancesFromSpot(screenPointX, screenPointY,
          explodedFeatures.features);
        const [distance] = getClosestSpotDistanceAndIndex(explodedFeaturesDistancesFromSpot);
        distances[i] = distance;
      }
      else {
        const eachFeature = JSON.parse(JSON.stringify(featuresInRect[i]));
        screenCoords = Platform.OS === 'web' ? mapRef.current.project(eachFeature.geometry.coordinates)
          : await mapRef.current.getPointInView(eachFeature.geometry.coordinates);
        if (Platform.OS === 'web') screenCoords = [screenCoords.x, screenCoords.y];
        else if (Platform.OS === 'android') {
          const pixelRatio = PixelRatio.get();
          screenCoords = [screenCoords[0] / pixelRatio, screenCoords[1] / pixelRatio];
        }
        eachFeature.geometry.coordinates = screenCoords;
        distances[i] = turf.distance(dummyFeature, eachFeature);
      }
    }
    return distances;
  };

  // Get the nearest draw feature from the draw layer where the screen was pressed
  const getDrawFeatureAtPress = async (screenPointX, screenPoint) => {
    const nearestDrawFeature = await getNearestFeatureInBBox([screenPointX, screenPoint], ['pointLayerDraw']);
    if (isEmpty(nearestDrawFeature)) console.log('No draw features near press.');
    else console.log('Got draw feature:', nearestDrawFeature);
    return Promise.resolve(nearestDrawFeature);
  };

  // Get Spots within (points) or intersecting (line or polygon) the drawn polygon
  const getLassoedSpots = (features, drawnPolygon) => {
    let selectedSpots = [];
    try {
      if (!drawnPolygon || !drawnPolygon.geometry || !drawnPolygon.geometry.coordinates?.length) {
        return [];
      }
      let selectedFeaturesIds = [];
      features.forEach((feature) => {
        if (feature.geometry.type !== 'GeometryCollection' && (turf.booleanWithin(feature, drawnPolygon)
          || (feature.geometry.type === 'LineString' && turf.lineIntersect(feature, drawnPolygon).features.length > 0)
          || (feature.geometry.type === 'Polygon' && turf.booleanOverlap(feature, drawnPolygon)))) {
          selectedFeaturesIds.push(feature.properties.id);
        }
      });
      let selectedSpotsIds = [...new Set(selectedFeaturesIds)]; // Remove duplicate ids
      selectedSpots = getSpotsByIds(selectedSpotsIds);

      // Get Nested children and add to selected Ids
      selectedSpots.forEach((spot) => {
        const children = getChildrenGenerationsSpots(spot, 10).flat();
        const childrenIds = children.map(child => child.properties.id);
        selectedSpotsIds.push(...childrenIds);
        console.log('selectedFeaturesIds', selectedFeaturesIds);
      });
      selectedSpotsIds = [...new Set(selectedSpotsIds)]; // Remove duplicate ids
      selectedSpots = getSpotsByIds(selectedSpotsIds);
    }
    catch (e) {
      console.log('Error getting Spots within or intersecting the drawn polygon', e);
    }
    //console.log('Spots in given polygon:', selectedSpots);
    return selectedSpots;
  };

  // Get the nearest feature to a target point in screen coordinates within a bounding box from given layers
  const getNearestFeatureInBBox = async ([x, y], layers) => {
    // First get all the features in the bounding box
    const bbox = getBBoxPaddedInPixels([x, y]);
    const nearFeaturesCollection = Platform.OS === 'web' ? mapRef.current.queryRenderedFeatures(bbox, {layers: layers})
      : await mapRef.current.queryRenderedFeaturesInRect(bbox, null, layers);
    let nearFeatures = Platform.OS === 'web' ? nearFeaturesCollection : nearFeaturesCollection.features;
    if (nearFeatures.length > 0) console.log('Near features:', nearFeatures);

    // If more than one near feature is found, return a random one (user needs to zoom in if too many features found)
    const randomIndex = Math.floor(Math.random() * nearFeatures.length);
    return Promise.resolve(nearFeatures[randomIndex] || []);
  };

  // Get the Spot where screen was pressed
  const getSpotAtPress = async (screenPointX, screenPointY) => {
    const nearestFeature = await getNearestFeatureInBBox([screenPointX, screenPointY], spotLayers);
    const nearestSpot = nearestFeature?.properties?.id ? getSpotById(
      nearestFeature.properties.id) || nearestFeature : {};
    if (isEmpty(nearestSpot)) console.log('No spots near press.');
    else console.log('Got nearest spot:', nearestSpot);
    return Promise.resolve(...[nearestSpot]);
  };

  // This method is required when the draw features at press returns empty
  // We explode the features and identify the closest vertex from the screen point (x,y) on the spot
  // returns an array of vertex and its index.
  const identifyClosestVertexOnSpotPress = async (spotFound, screenPointX, screenPointY, spotsEdited) => {
    let editedSpot = spotsEdited.find(spot => spot.properties.id === spotFound.properties.id);
    spotFound = editedSpot ? editedSpot : spotFound;
    let spotFoundCopy = JSON.parse(JSON.stringify(spotFound));
    if (currentImageBasemap || stratSection) spotFoundCopy = convertImagePixelsToLatLong(spotFoundCopy);
    const explodedFeatures = turf.explode(spotFoundCopy).features;
    const distances = await getDistancesFromSpot(screenPointX, screenPointY, explodedFeatures);
    const [distance, closestVertexIndex] = getClosestSpotDistanceAndIndex(distances);
    // In case of imagebasemap, return the original non-converted vertex
    if (currentImageBasemap || stratSection) {
      return [turf.explode(spotFound).features[closestVertexIndex], closestVertexIndex];
    }
    else return [explodedFeatures[closestVertexIndex], closestVertexIndex];
  };

  return {
    getDrawFeatureAtPress: getDrawFeatureAtPress,
    getLassoedSpots: getLassoedSpots,
    getNearestFeatureInBBox: getNearestFeatureInBBox,
    getSpotAtPress: getSpotAtPress,
    identifyClosestVertexOnSpotPress: identifyClosestVertexOnSpotPress,
  };
};

export default useMapFeaturesCalculated;
