import {Platform} from 'react-native';

import * as turf from '@turf/turf';
import {useSelector} from 'react-redux';

import {SPOT_LAYERS} from './maps.constants';
import {getClosestSpotDistanceAndIndex} from './maps.helpers';
import useMapCoords from './useMapCoords';
import useMapFeatures from './useMapFeatures';
import {isEmpty} from '../../shared/helpers';
import useNesting from '../nesting/useNesting';
import {useSpots} from '../spots';

const useMapFeaturesCalculated = (mapRef) => {
  /* Data Hooks */

  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const stratSection = useSelector(state => state.map.stratSection);

  const {convertImagePixelsToLatLong, getBBoxPaddedInPixels} = useMapCoords();
  const {isSpotOnCurrentMap} = useMapFeatures();
  const {getChildrenGenerationsSpots} = useNesting();
  const {getSpotById, getSpotsByIds} = useSpots();

  /* Internal Functions */

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
        // getPointInView seems to include pixel ratio adjustment for Android
        // now after updating @rnmapbox/maps from v10.1.39 to v10.2.10
        // else if (Platform.OS === 'android') {
        //   const pixelRatio = PixelRatio.get();
        //   screenCoords = [screenCoords[0] / pixelRatio, screenCoords[1] / pixelRatio];
        // }
        eachFeature.geometry.coordinates = screenCoords;
        distances[i] = turf.distance(dummyFeature, eachFeature);
      }
    }
    return distances;
  };

  // Get all rendered features within the press box for the given layers. r sets the box padding
  // (r near 0 requires a press directly on the feature; the default gives a comfortable tolerance).
  const getFeaturesInBBox = async ([x, y], layers, r = 15) => {
    const bbox = getBBoxPaddedInPixels([x, y], r);
    const nearFeaturesCollection = Platform.OS === 'web' ? mapRef.current.queryRenderedFeatures(bbox, {layers: layers})
      : await mapRef.current.queryRenderedFeaturesInRect(bbox, null, layers);
    const nearFeatures = Platform.OS === 'web' ? nearFeaturesCollection : nearFeaturesCollection.features;
    if (nearFeatures?.length > 0) console.log('Near features:', nearFeatures);
    return nearFeatures || [];
  };

  /* Exported Functions */

  // Get a draw feature from the draw layer where the screen was pressed
  const getDrawFeatureAtPress = async (screenPointX, screenPoint) => {
    const drawFeature = await getRandomFeatureInBBox([screenPointX, screenPoint], ['pointLayerDraw']);
    if (isEmpty(drawFeature)) console.log('No draw features near press.');
    else console.log('Got draw feature:', drawFeature);
    return Promise.resolve(drawFeature);
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

  // Get Spots within an axis-aligned map-extent bounding box given as two opposite corners in any
  // order: bbox = [cornerA lng, cornerA lat, cornerB lng, cornerB lat] (normalized below).
  // Uses a cheap coordinate range check for Point Spots (the common case) and only falls back to
  // the heavier turf checks for line/polygon geometries. Mirrors getLassoedSpots' nested-children
  // expansion so the results match, while avoiding a turf.booleanWithin call per Point Spot.
  const getSpotsInBoundingBox = (features, bbox) => {
    let selectedSpots = [];
    try {
      if (isEmpty(features) || !bbox || bbox.length < 4) return [];
      // Normalize corners so the range check is correct regardless of the order the map SDK returns
      // bounds in: mapbox-gl (web) returns SW→NE while @rnmapbox (native) returns NE→SW.
      const minLng = Math.min(bbox[0], bbox[2]);
      const maxLng = Math.max(bbox[0], bbox[2]);
      const minLat = Math.min(bbox[1], bbox[3]);
      const maxLat = Math.max(bbox[1], bbox[3]);
      const bboxPoly = turf.bboxPolygon([minLng, minLat, maxLng, maxLat]);
      let selectedFeaturesIds = [];
      features.forEach((feature) => {
        const geometryType = feature.geometry?.type;
        if (geometryType === 'Point') {
          const [lng, lat] = feature.geometry.coordinates;
          if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
            selectedFeaturesIds.push(feature.properties.id);
          }
        }
        else if (geometryType && geometryType !== 'GeometryCollection' && (turf.booleanWithin(feature, bboxPoly)
          || (geometryType === 'LineString' && turf.lineIntersect(feature, bboxPoly).features.length > 0)
          || (geometryType === 'Polygon' && turf.booleanOverlap(feature, bboxPoly)))) {
          selectedFeaturesIds.push(feature.properties.id);
        }
      });
      let selectedSpotsIds = [...new Set(selectedFeaturesIds)]; // Remove duplicate ids
      selectedSpots = getSpotsByIds(selectedSpotsIds);

      // Get nested children and add to selected Ids
      selectedSpots.forEach((spot) => {
        const children = getChildrenGenerationsSpots(spot, 10).flat();
        const childrenIds = children.map(child => child.properties.id);
        selectedSpotsIds.push(...childrenIds);
      });
      selectedSpotsIds = [...new Set(selectedSpotsIds)]; // Remove duplicate ids
      selectedSpots = getSpotsByIds(selectedSpotsIds);
    }
    catch (e) {
      console.log('Error getting Spots within the bounding box', e);
    }
    return selectedSpots;
  };

  // Get one feature at the press, chosen at random when several overlap (user zooms in to narrow it).
  const getRandomFeatureInBBox = async ([x, y], layers) => {
    const nearFeatures = await getFeaturesInBBox([x, y], layers);
    const randomIndex = Math.floor(Math.random() * nearFeatures.length);
    return Promise.resolve(nearFeatures[randomIndex] || []);
  };

  // Get the Spot where screen was pressed
  const getSpotAtPress = async (screenPointX, screenPointY) => {
    const featureAtPress = await getRandomFeatureInBBox([screenPointX, screenPointY], SPOT_LAYERS);
    const spotAtPress = featureAtPress?.properties?.id ? getSpotById(
      featureAtPress.properties.id) || featureAtPress : {};
    if (isEmpty(spotAtPress)) console.log('No spots near press.');
    else console.log('Got spot at press:', spotAtPress);
    return Promise.resolve(...[spotAtPress]);
  };

  // Get every Spot overlapping the press, deduped and scoped to the current map, for the caller to
  // disambiguate - vs getSpotAtPress (one random Spot) or getSpotsInBoundingBox (adds nested children).
  // isPreciseHit shrinks the box so only a Spot directly under the press matches (e.g. Macrostrat).
  const getSpotsAtPress = async (screenPointX, screenPointY, isPreciseHit = false) => {
    const nearFeatures = await getFeaturesInBBox([screenPointX, screenPointY], SPOT_LAYERS,
      isPreciseHit ? 1 : 15);
    // queryRenderedFeatures returns the same Spot multiple times (across layers and tile seams), so dedupe.
    const spotsIds = [...new Set(nearFeatures.map(feature => feature?.properties?.id).filter(id => id != null))];
    const spotsAtPress = getSpotsByIds(spotsIds).filter(isSpotOnCurrentMap);
    console.log('Got Spots at press:', spotsAtPress);
    return spotsAtPress;
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
    getDrawFeatureAtPress,
    getLassoedSpots,
    getRandomFeatureInBBox,
    getSpotAtPress,
    getSpotsAtPress,
    getSpotsInBoundingBox,
    identifyClosestVertexOnSpotPress,
  };
};

export default useMapFeaturesCalculated;
