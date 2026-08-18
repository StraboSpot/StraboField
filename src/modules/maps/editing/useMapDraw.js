import {useEffect, useState} from 'react';
import {Platform} from 'react-native';

import * as turf from '@turf/turf';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/helpers';
import {getIsFreehandDrawing} from '../../sketch/FreehandSketch';
import {setSelectedSpot} from '../../spots/spots.slice';
import useSpots from '../../spots/useSpots';
import {MAP_MODES} from '../maps.constants';
import {setFreehandFeatureCoords} from '../maps.slice';
import {
  getScreenExtent,
  getScreenPolygonWidth,
  thinCoordsByDistance,
  thinCoordsByPixels,
} from './editing.helpers';
import useMapSymbology from '../symbology/useMapSymbology';
import useMapCoords from '../view/useMapCoords';

// Smallest geometry worth saving, in screen pixels. Below these the Spot is invisible on the map and can only be
// reached from the Spots list. A line must span MIN_LINE_EXTENT_PIXELS in at least one dimension; a polygon must
// be at least MIN_POLYGON_WIDTH_PIXELS thick, which for a drawn shape is about half its narrower side.
const MIN_LINE_EXTENT_PIXELS = 10;
const MIN_POLYGON_WIDTH_PIXELS = 5;
const TOO_SMALL_MESSAGE = 'Too Small to Draw!\nDraw a larger line or area.';

const useMapDraw = ({applySelectingMode, mapMode, mapRef, onEndDrawPressed, selectingMode}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const freehandFeatureCoords = useSelector(state => state.map.freehandFeatureCoords);
  const freehandVertexSpacing = useSelector(state => state.map.freehandVertexSpacing);
  const stratSection = useSelector(state => state.map.stratSection);

  const {convertFeatureGeometryToImagePixels} = useMapCoords();
  const {getSymbology} = useMapSymbology();
  const {createSpot} = useSpots();
  const toast = useToast();

  /* Local State */

  const [drawFeatures, setDrawFeatures] = useState([]);

  /* Side Effects */

  useEffect(() => {
    // console.log('UE useMapDraw [drawFeatures]');
    if ((mapMode === MAP_MODES.DRAW.POINT) && drawFeatures.length === 1) onEndDrawPressed();
  }, [drawFeatures]);

  useEffect(() => {
    // Preview the thinned freehand line/polygon (with vertices) after finger-lift, so the user sees it before
    // save - or clear it and say why, when the stroke is too small to end up visible.
    if (mapMode !== MAP_MODES.DRAW.FREEHANDLINE && mapMode !== MAP_MODES.DRAW.FREEHANDPOLYGON) return;
    if (!freehandFeatureCoords || freehandFeatureCoords.length <= 2) {
      setDrawFeatures([]);
      return;
    }
    if (getIsGeometryTooSmall(freehandFeatureCoords, getFreehandGeometryType())) {
      // A new stroke may already be under way; re-rendering the map now would truncate it, and that stroke's own
      // lift will re-run this effect anyway.
      if (getIsFreehandDrawing()) return;
      setDrawFeatures([]);
      toast.show(TOO_SMALL_MESSAGE);
      return;
    }
    let isCancelled = false;
    (async () => {
      const feature = await buildFreehandFeature(freehandFeatureCoords);
      // Bail if a new stroke started while building — setDrawFeatures would re-render the map and truncate it.
      if (isCancelled || !feature || getIsFreehandDrawing()) return;
      // In a selecting mode the area isn't saved, so show just the lasso outline without the vertex points.
      setDrawFeatures(selectingMode ? [feature] : [feature, ...turf.explode(feature).features]);
    })();
    return () => {
      isCancelled = true;
    };
  }, [freehandFeatureCoords]);

  /* Internal Functions */

  // Convert thinned freehand screen points into a geographic line/polygon feature (without properties).
  // Returns undefined for a stroke with too few points to form one, or one too small to end up visible - endDraw
  // rebuilds through here when no preview exists, so this is what stops a rejected stroke saving anyway.
  const buildFreehandFeature = async (screenPoints) => {
    if (!screenPoints || screenPoints.length <= 2) return undefined;
    if (getIsGeometryTooSmall(screenPoints, getFreehandGeometryType())) return undefined;
    // Selecting modes lasso existing Spots without saving the area, so keep the full-resolution outline -
    // thinning is a save-time concern and would coarsen the selection boundary and miss Spots.
    const isThinning = !selectingMode;
    const screenCoordinates = isThinning && freehandVertexSpacing?.unit === 'pixels'
      ? thinCoordsByPixels(screenPoints, freehandVertexSpacing.pixelSpacing)
      : screenPoints;
    let featureCoordinates = [];
    for (let i = 0; i < screenCoordinates.length; i++) {
      const geoCoordinates = Platform.OS === 'web' ? mapRef.current.unproject(screenCoordinates[i]).toArray()
        : await mapRef.current.getCoordinateFromView(screenCoordinates[i]);
      featureCoordinates.push(geoCoordinates);
    }
    if (isThinning && freehandVertexSpacing?.unit === 'distance') {
      featureCoordinates = thinCoordsByDistance(featureCoordinates, freehandVertexSpacing.distanceSpacing);
    }
    if (mapMode === MAP_MODES.DRAW.FREEHANDPOLYGON) {
      featureCoordinates.push(featureCoordinates[0]); // First and Last coordinates of polygon should match
      return turf.polygon([featureCoordinates]);
    }
    return turf.lineString(featureCoordinates);
  };

  // The freehand paths measure raw screen points before any feature exists, so the type comes from the mode.
  // Freehand-only: every other mode falls through to LineString, which is meaningless for a tap-placed polygon.
  const getFreehandGeometryType = () => (mapMode === MAP_MODES.DRAW.FREEHANDPOLYGON ? 'Polygon' : 'LineString');

  // A Point draws as a fixed-size marker, so only lines and polygons can be too small to see.
  const getIsFeatureTooSmall = async (feature) => {
    const geometryType = turf.getType(feature);
    if (geometryType === 'Point') return false;
    return getIsGeometryTooSmall(await getScreenPointsForFeature(feature), geometryType);
  };

  // Geometry enclosing nothing visible still saves a Spot, which then can't be seen or selected on the map though
  // it stays in the Spots list and syncs on upload. Test in screen space - it is what "I can't see it" means, and
  // it is zoom-independent in a way a ground-distance test is not. Selecting modes are exempt: a tiny lasso should
  // select nothing, not warn.
  const getIsGeometryTooSmall = (screenPoints, geometryType) => {
    if (selectingMode) return false;
    if (geometryType === 'Polygon') return getScreenPolygonWidth(screenPoints) < MIN_POLYGON_WIDTH_PIXELS;
    return getScreenExtent(screenPoints) < MIN_LINE_EXTENT_PIXELS;
  };

  // Project a built feature's coordinates back to screen pixels. Tap-placed geometry is only ever in geographic
  // coordinates, so it has to come back to screen space to be measured by the same rule as a freehand stroke.
  const getScreenPointsForFeature = async (feature) => {
    const coordinates = turf.getType(feature) === 'Polygon' ? turf.getCoords(feature)[0] : turf.getCoords(feature);
    const screenPoints = [];
    for (const coordinate of coordinates) {
      if (Platform.OS === 'web') {
        const {x, y} = mapRef.current.project(coordinate);
        screenPoints.push([x, y]);
      }
      else screenPoints.push(await mapRef.current.getPointInView(coordinate));
    }
    return screenPoints;
  };

  /* Exported Functions */

  const cancelDraw = () => {
    setDrawFeatures([]);
    console.log('Draw canceled.');
  };

  const endDraw = async () => {
    let newOrEditedSpot = {};
    if (mapMode === MAP_MODES.DRAW.FREEHANDPOLYGON || mapMode === MAP_MODES.DRAW.FREEHANDLINE) {
      // Save the same thinned feature that was previewed on finger-lift (rebuild if the preview isn't ready).
      let feature = drawFeatures.find(f => f.geometry.type !== 'Point')
        || await buildFreehandFeature(freehandFeatureCoords);
      if (feature) {
        if (currentImageBasemap) { //create new spot for imagebasemap - needs lat long to pixel conversion
          feature = convertFeatureGeometryToImagePixels(feature);
          feature.properties.image_basemap = currentImageBasemap.id;
        }
        else if (stratSection) { //create new spot for strat section - needs lat long to pixel conversion
          feature = convertFeatureGeometryToImagePixels(feature);
          feature.properties.strat_section_id = stratSection.strat_section_id;
        }
        const isHandledBySelectingMode = await applySelectingMode(feature, selectingMode);
        if (!isHandledBySelectingMode) {
          feature.properties.symbology = getSymbology(feature);
          newOrEditedSpot = await createSpot(feature);
          dispatch(setSelectedSpot(newOrEditedSpot));
        }
        setDrawFeatures([]);
        dispatch(setFreehandFeatureCoords(undefined));  // reset the freeHandCoordinates
      }
    }
    else if (!isEmpty(drawFeatures)) {
      let newFeature = drawFeatures[0];  // If one draw feature the Spot is just a point
      // If there is more than one draw feature (should be no more than three) the first is the first vertex
      // placed, the second is the line or polygon between the vertices, and the third is the last vertex placed
      // Grab the second feature to create the Spot
      if (drawFeatures.length > 1) newFeature = drawFeatures.splice(1, 1)[0];
      if (await getIsFeatureTooSmall(newFeature)) toast.show(TOO_SMALL_MESSAGE);
      else {
        newFeature.properties.symbology = getSymbology(newFeature);
        if (currentImageBasemap) { //create new spot for imagebasemap - needs lat long to pixel conversion
          newFeature = convertFeatureGeometryToImagePixels(newFeature);
          newFeature.properties.image_basemap = currentImageBasemap.id;
        }
        else if (stratSection) { //create new spot for imagebasemap - needs lat long to pixel conversion
          newFeature = convertFeatureGeometryToImagePixels(newFeature);
          newFeature.properties.strat_section_id = stratSection.strat_section_id;
        }
        const isHandledBySelectingMode = await applySelectingMode(newFeature, selectingMode);
        if (!isHandledBySelectingMode) {
          newOrEditedSpot = await createSpot(newFeature);
          dispatch(setSelectedSpot(newOrEditedSpot));
        }
      }
      setDrawFeatures([]);
    }
    console.log('Draw ended.');
    dispatch(setFreehandFeatureCoords(undefined));  // reset the freeHandCoordinates
    return Promise.resolve(newOrEditedSpot);
  };

  const setDrawFeaturesNew = (e) => {
    console.log('Drawing', mapMode, '...');
    let feature = {};
    const newCoord = Platform.OS === 'web' ? [e.lngLat.lng, e.lngLat.lat] : turf.getCoord(e);
    // Draw a point for the last coordinate touched
    // const lastVertexPlaced = MapboxGL.geoUtils.makeFeature(e.geometry);
    const lastVertexPlaced = turf.point(newCoord);
    // Draw a point (if set point to current location not working)
    if (mapMode === MAP_MODES.DRAW.POINT) setDrawFeatures([lastVertexPlaced]);
    else if (isEmpty(drawFeatures)) setDrawFeatures([lastVertexPlaced]);
    // Draw a line given a point and a new point
    else if (drawFeatures.length === 1) {
      const firstVertexPlaced = drawFeatures[0];
      const firstVertexPlacedCoords = turf.getCoords(firstVertexPlaced);
      feature = turf.lineString([firstVertexPlacedCoords, newCoord]);
      setDrawFeatures([firstVertexPlaced, feature, lastVertexPlaced]);
    }
    // Draw a line given a line and a new point
    else if (drawFeatures.length > 1 && mapMode === MAP_MODES.DRAW.LINE) {
      const firstVertexPlaced = drawFeatures[0];
      const lineCoords = turf.getCoords(drawFeatures[1]);
      feature = turf.lineString([...lineCoords, newCoord]);
      setDrawFeatures([firstVertexPlaced, feature, lastVertexPlaced]);
    }
    else if (drawFeatures.length > 1 && mapMode === MAP_MODES.DRAW.POLYGON) {
      const firstVertexPlaced = drawFeatures[0];
      const firstVertexPlacedCoords = turf.getCoords(firstVertexPlaced);

      // Draw a polygon given a line and a new point
      if (turf.getType(drawFeatures[1]) === 'LineString') {
        const lineCoords = turf.getCoords(drawFeatures[1]);
        feature = turf.polygon([[...lineCoords, newCoord, firstVertexPlacedCoords]]);
      }
      // Draw a polygon given a polygon and a new point
      else {
        let polyCoords = turf.getCoords(drawFeatures[1])[0];
        polyCoords.pop();
        feature = turf.polygon([[...polyCoords, newCoord, firstVertexPlacedCoords]]);
      }
      setDrawFeatures([firstVertexPlaced, feature, lastVertexPlaced]);
    }
  };

  return {
    cancelDraw,
    drawFeatures,
    endDraw,
    setDrawFeatures,
    setDrawFeaturesNew,
  };
};

export default useMapDraw;
