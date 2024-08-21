import * as turf from '@turf/turf';

import {isEmpty} from '../../shared/Helpers';
import {useSpotsHook} from '../spots';

const useNesting = () => {
  const useSpots = useSpotsHook();

  // Is spot 1 completely within spot 2?
  // Boolean-within returns true if the first geometry is completely within the second geometry.
  const isWithin = (spot1, spot2) => {
    let boolWithin = false;
    const validTypesForBooleanWithin = {
      'Point': ['MultiPoint', 'LineString', 'Polygon'],
      'MultiPoint': ['MultiPoint', 'LineString', 'Polygon', 'MultiPolygon'],
      'LineString': ['LineString', 'Polygon', 'MultiPolygon'],
      'Polygon': ['Polygon', 'MultiPolygon'],
    };
    try {
      // Make sure we're using booleanWithin with valid types
      if (Object.keys(validTypesForBooleanWithin).includes(spot1.geometry.type)
        && validTypesForBooleanWithin[spot1.geometry.type]?.includes(spot2.geometry.type)) {
        boolWithin = turf.booleanWithin(spot1, spot2);
      }
      // Handle Geometry Collections
      else if (spot1.geometry.type === 'GeometryCollection') {
        spot1.geometry.geometries.forEach((geometry1) => {
          if (!boolWithin && Object.keys(validTypesForBooleanWithin).includes(geometry1.type)
            && validTypesForBooleanWithin[geometry1]?.includes(spot2.geometry.type)) {
            boolWithin = turf.booleanWithin(geometry1, spot2.geometry.type);
          }
          else if (!boolWithin && spot2.geometry.type === 'GeometryCollection') {
            spot2.geometry.geometries.forEach((geometry2) => {
              if (!boolWithin && Object.keys(validTypesForBooleanWithin).includes(geometry1.type)
                && validTypesForBooleanWithin[geometry1]?.includes(geometry2)) {
                boolWithin = turf.booleanWithin(geometry1, geometry2);
              }
            });
          }
        });
      }
      else if (spot2.geometry.type === 'GeometryCollection') {
        spot2.geometry.geometries.forEach((geometry2) => {
          if (!boolWithin && Object.keys(validTypesForBooleanWithin).includes(spot1.geometry.type)
            && validTypesForBooleanWithin[spot1.geometry.type]?.includes(geometry2.type)) {
            boolWithin = turf.booleanWithin(spot1.geometry, geometry2);
          }
        });
      }
    }
    catch (e) {
      console.error('Error with Spot geometry! Spot 1:', spot1, 'Spot 2:', spot2, 'Error:', e);
    }
    return boolWithin;
  };

  // Get all the children Spots of thisSpot, based on image basemaps, strat sections and geometry
  // & also Spots stored in spot.properties.nesting not nested through geometry
  function getChildrenSpots(thisSpot, activeSpots) {
    console.log('Getting Children Spots...');
    let childrenSpots = [];
    // Find active children spots based on image basemap
    if (thisSpot.properties.images) {
      const imageBasemaps = thisSpot.properties.images.map(image => image.id);
      const imageBasemapChildrenSpots = activeSpots.filter(
        spot => imageBasemaps.includes(spot.properties.image_basemap));
      childrenSpots.push(imageBasemapChildrenSpots);
    }
    // Find active children spots based on strat section
    if (thisSpot.properties.sed && thisSpot.properties.sed.strat_section) {
      const stratSectionChildrenSpots = activeSpots.filter(
        spot => thisSpot.properties.sed.strat_section.strat_section_id === spot.properties.strat_section_id);
      childrenSpots.push(stratSectionChildrenSpots);
    }
    // Find active children spots not nested through geometry - nested directly in spot.properties.nesting
    if (thisSpot.properties.nesting) {
      let nonGeomChildrenSpots = [];
      thisSpot.properties.nesting.forEach((spotId) => {
        if (useSpots.getSpotById(spotId)) nonGeomChildrenSpots.push(useSpots.getSpotById(spotId));
        else {
          thisSpot.properties.nesting = thisSpot.properties.nesting.filter(nestingId => nestingId !== spotId);
          if (isEmpty(thisSpot.properties.nesting)) delete thisSpot.properties.nesting;
        }
      });
      childrenSpots.push(nonGeomChildrenSpots);
    }
    childrenSpots = childrenSpots.flat();
    // Find active children spots based on geometry
    // Only non-point features can have children
    if (thisSpot.geometry && thisSpot.geometry.type) {
      if (thisSpot.geometry.type !== 'Point') {
        const otherSpots = activeSpots.filter(spot => spot.geometry && spot.properties.id !== thisSpot.properties.id);
        otherSpots.forEach((spot) => {
          if ((!thisSpot.properties.image_basemap && !spot.properties.image_basemap)
            || (thisSpot.properties.image_basemap && spot.properties.image_basemap
              && thisSpot.properties.image_basemap === spot.properties.image_basemap)) {
            if (thisSpot.geometry.type && thisSpot.geometry.type === 'Polygon'
              || thisSpot.geometry.type === 'MultiPolygon'
              || thisSpot.geometry.type === 'GeometryCollection') {
              if (isWithin(spot, thisSpot)) childrenSpots.push(spot);
            }
          }
        });
      }
    }
    return childrenSpots;
  }

  // Get the children of an array of Spots
  function getChildrenOfSpots(spots1, activeSpots) {
    let allChildrenSpots = [];
    spots1.forEach((spot) => {
      const childrenSpots = getChildrenSpots(spot, activeSpots);
      if (!isEmpty(childrenSpots)) allChildrenSpots.push(childrenSpots);
    });
    return allChildrenSpots.flat();
  }

  // Get i generations of active children spots for thisSpot
  function getChildrenGenerationsSpots(thisSpot, i) {
    const activeSpots = Object.values(useSpots.getActiveSpotsObj());
    let childrenGenerations = [];
    let childSpots = [thisSpot];
    Array.from({length: i}, () => {
      childSpots = getChildrenOfSpots(childSpots, activeSpots);
      // Remove a child Spot if already in the list of children generation Spots
      childSpots = childSpots.filter(childSpot => !childrenGenerations.flat().find(
        knownChildSpot => childSpot.properties.id === knownChildSpot.properties.id));
      if (!isEmpty(childSpots)) childrenGenerations.push(childSpots);
    });
    console.log('Found Children Generations:', childrenGenerations);
    return childrenGenerations;
  }

  // Get i generations of active parent spots for thisSpot
  const getParentGenerationsSpots = (thisSpot, i) => {
    const activeSpots = Object.values(useSpots.getActiveSpotsObj());
    let parentGenerations = [];
    let parentSpots = [thisSpot];
    Array.from({length: i}, () => {
      parentSpots = getParentsOfSpots(parentSpots, activeSpots);
      // Remove a parent Spot if already in the list of parent generation Spots
      parentSpots = parentSpots.filter(parentSpot => !parentGenerations.flat().find(
        knownParentSpot => parentSpot.properties.id === knownParentSpot.properties.id));
      if (!isEmpty(parentSpots)) parentGenerations.push(parentSpots);
    });
    console.log('Found Parent Generations', parentGenerations);
    return parentGenerations;
  };

  // Get all the parent Spots of thisSpot, based on image basemaps, strat sections and geometry
  // & also Spots stored in spot.properties.nesting not nested through geometry
  function getParentSpots(thisSpot, activeSpots) {
    console.log('Getting Parent Spots...');
    let parentSpots = [];
    // Find active parent spots based on image basemap
    if (thisSpot.properties.image_basemap) {
      const parentImageBasemapSpot = activeSpots.find(spot => spot.properties.images && spot.properties.images.find(
        image => image.id === thisSpot.properties.image_basemap));
      parentSpots.push(parentImageBasemapSpot);
    }
    // Find active parent spots based on strat section
    if (thisSpot.properties.strat_section_id) {
      const parentStratSectionSpot = activeSpots.find(
        spot => spot.properties?.sed?.strat_section?.strat_section_id === thisSpot.properties.strat_section_id);
      parentSpots.push(parentStratSectionSpot);
    }
    // Find active parent Spots not nested through geometry - nested directly in spot.properties.nesting
    const parentNonGeomSpot = activeSpots.find(
      spot => spot.properties.nesting && spot.properties.nesting.includes(thisSpot.properties.id));
    if (parentNonGeomSpot) parentSpots.push(parentNonGeomSpot);
    parentSpots = parentSpots.flat();
    // Find active parent spots based on geometry
    if (thisSpot.geometry) {
      const otherSpots = activeSpots.filter(spot => spot.geometry && spot.properties.id !== thisSpot.properties.id);
      otherSpots.forEach((spot) => {
        if ((!thisSpot.properties.image_basemap && !spot.properties.image_basemap)
          || (thisSpot.properties.image_basemap && spot.properties.image_basemap
            && thisSpot.properties.image_basemap === spot.properties.image_basemap)) {
          if (spot.geometry.type && (spot.geometry.type === 'Polygon'
            || spot.geometry.type === 'MultiPolygon' || spot.geometry.type === 'GeometryCollection')) {
            if (isWithin(thisSpot, spot)) parentSpots.push(spot);
          }
        }
      });
    }
    return parentSpots;
  }

  // Get the parents of an array of Spots
  function getParentsOfSpots(spots1, activeSpots) {
    let allParentSpots = [];
    spots1.forEach((spot) => {
      const parentSpots = getParentSpots(spot, activeSpots);
      if (!isEmpty(parentSpots)) allParentSpots.push(parentSpots);
    });
    return allParentSpots.flat();
  }

  return {
    getChildrenGenerationsSpots: getChildrenGenerationsSpots,
    getParentGenerationsSpots: getParentGenerationsSpots,
  };
};

export default useNesting;
