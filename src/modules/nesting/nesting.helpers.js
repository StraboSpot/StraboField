import * as turf from '@turf/turf';

import {VALID_TYPES_FOR_BOOLEAN_WITHIN} from './nesting.constants';
import {isEmpty} from '../../shared/helpers';
import {isOnSameMap} from '../spots/spots.helpers';

// Is spot 1 completely within spot 2?
// Boolean-within returns true if the first geometry is completely within the second geometry.
export const isWithin = (spot1, spot2) => {
  let boolWithin = false;
  try {
    // Make sure we're using booleanWithin with valid types
    if (Object.keys(VALID_TYPES_FOR_BOOLEAN_WITHIN).includes(spot1.geometry.type)
      && VALID_TYPES_FOR_BOOLEAN_WITHIN[spot1.geometry.type]?.includes(spot2.geometry.type)) {
      boolWithin = turf.booleanWithin(spot1, spot2);
    }
    // Handle Geometry Collections
    else if (spot1.geometry.type === 'GeometryCollection') {
      spot1.geometry.geometries.forEach((geometry1) => {
        if (!boolWithin && Object.keys(VALID_TYPES_FOR_BOOLEAN_WITHIN).includes(geometry1.type)
          && VALID_TYPES_FOR_BOOLEAN_WITHIN[geometry1.type]?.includes(spot2.geometry.type)) {
          boolWithin = turf.booleanWithin(geometry1, spot2);
        }
        else if (!boolWithin && spot2.geometry.type === 'GeometryCollection') {
          spot2.geometry.geometries.forEach((geometry2) => {
            if (!boolWithin && Object.keys(VALID_TYPES_FOR_BOOLEAN_WITHIN).includes(geometry1.type)
              && VALID_TYPES_FOR_BOOLEAN_WITHIN[geometry1.type]?.includes(geometry2.type)) {
              boolWithin = turf.booleanWithin(geometry1, geometry2);
            }
          });
        }
      });
    }
    else if (spot2.geometry.type === 'GeometryCollection') {
      spot2.geometry.geometries.forEach((geometry2) => {
        if (!boolWithin && Object.keys(VALID_TYPES_FOR_BOOLEAN_WITHIN).includes(spot1.geometry.type)
          && VALID_TYPES_FOR_BOOLEAN_WITHIN[spot1.geometry.type]?.includes(geometry2.type)) {
          boolWithin = turf.booleanWithin(spot1.geometry, geometry2);
        }
      });
    }
  }
  catch (err) {
    console.error('Error with Spot geometry! Spot 1:', spot1, 'Spot 2:', spot2, 'Error:', err);
  }
  return boolWithin;
};

const isPolygon = spot => spot.geometry?.type === 'Polygon' || spot.geometry?.type === 'MultiPolygon';

// A Spot nests by geometry in a polygon it lies within on the same map. Samples never nest by geometry.
const isNestedByGeometry = (child, parent) => child.properties.id !== parent.properties.id
  && !child.properties.isSample && !parent.properties.isSample && !!child.geometry && isPolygon(parent)
  && isOnSameMap(child, parent) && isWithin(child, parent);

// The children of a Spot: its samples and the Spots in its nesting list, looked up in spots; the Spots on its image
// basemaps or strat section, found among searchedSpots; and the Spots within it, found among activeSpots.
export const getChildSpots = (thisSpot, {activeSpots, searchedSpots, spots}) => {
  const {images, isSample, nesting, samples, sed} = thisSpot.properties;
  const stratSectionId = sed?.strat_section?.strat_section_id;
  const children = [];
  if (!isSample && samples) children.push(...samples.map(sample => spots[sample.id]));
  if (images) {
    const imageIds = images.map(image => image.id);
    children.push(...searchedSpots.filter(spot => imageIds.includes(spot.properties.image_basemap)));
  }
  if (stratSectionId) {
    children.push(...searchedSpots.filter(spot => spot.properties.strat_section_id === stratSectionId));
  }
  if (nesting) children.push(...nesting.map(spotId => spots[spotId]));
  children.push(...activeSpots.filter(spot => isNestedByGeometry(spot, thisSpot)));
  return children.filter(Boolean);
};

// The parents of a Spot: the Spots holding its sample, image basemap or strat section and the Spots listing it in
// their nesting, found among allSpots; and the polygons it is within, found among activeSpots. A sample Spot is
// never the one holding a sample, though it keeps its own record in its samples.
export const getParentSpots = (thisSpot, {activeSpots, allSpots}) => {
  const {id, image_basemap: imageBasemapId, isSample, strat_section_id: stratSectionId} = thisSpot.properties;
  const parents = [];
  if (isSample) {
    parents.push(allSpots.find(spot => !spot.properties.isSample
      && spot.properties.samples?.some(sample => sample.id === id)));
  }
  if (imageBasemapId) {
    parents.push(allSpots.find(spot => spot.properties.images?.some(image => image.id === imageBasemapId)));
  }
  if (stratSectionId) {
    parents.push(allSpots.find(spot => spot.properties.sed?.strat_section?.strat_section_id === stratSectionId));
  }
  parents.push(...allSpots.filter(spot => spot.properties.nesting?.includes(id)));
  parents.push(...activeSpots.filter(spot => isNestedByGeometry(thisSpot, spot)));
  return parents.filter(Boolean);
};

// Up to levels generations out from thisSpot, getNextOf giving the Spots one generation on from a Spot. A Spot is
// listed once, in the nearest generation it is found in, and the Spot the walk starts from never is.
export const getGenerations = (thisSpot, levels, getNextOf) => {
  const knownIds = new Set([thisSpot.properties.id]);
  const generations = [];
  let generation = [thisSpot];
  for (let level = 0; level < levels; level++) {
    const nextGeneration = [];
    generation.flatMap(getNextOf).forEach((spot) => {
      if (knownIds.has(spot.properties.id)) return;
      knownIds.add(spot.properties.id);
      nextGeneration.push(spot);
    });
    if (isEmpty(nextGeneration)) break;
    generations.push(nextGeneration);
    generation = nextGeneration;
  }
  return generations;
};
