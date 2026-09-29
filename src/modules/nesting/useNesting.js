import {useSelector} from 'react-redux';

import {isWithin} from './nesting.helpers';
import {isEmpty} from '../../shared/helpers';
import useSpots from '../spots/useSpots';

const useNesting = () => {
  /* Data Hooks */
  const spots = useSelector(state => state.spot.spots);

  const {
    getActiveSpotsObj,
    getSpotById,
    getSpotWithThisSample,
    isOnGeoMap,
    isOnSameImageBasemap,
    isOnSameStratSection,
  } = useSpots();

  /* Internal Functions */

  // Get the children of an array of Spots
  const getChildrenOfSpots = (spots1, activeSpots, searchedSpots) => {
    let allChildrenSpots = [];
    spots1.forEach((spot) => {
      const childrenSpots = getChildrenSpots(spot, activeSpots, searchedSpots);
      if (!isEmpty(childrenSpots)) allChildrenSpots.push(childrenSpots);
    });
    return allChildrenSpots.flat();
  };

  // Get all the children Spots of thisSpot, based on sample, image basemaps, strat sections and geometry
  // & also Spots stored in spot.properties.nesting not nested through geometry
  const getChildrenSpots = (thisSpot, activeSpots, searchedSpots) => {
    console.log('Getting Children Spots...');
    let childrenSpots = [];
    // Find children spots based on sample
    if (!thisSpot.properties.isSample && thisSpot.properties.samples) {
      const sampleIds = thisSpot.properties.samples.map(sample => sample.id);
      const sampleChildrenSpots = sampleIds.map(sampleId => spots[sampleId]).filter(Boolean);
      childrenSpots.push(sampleChildrenSpots);
    }
    // Find children spots based on image basemap
    if (thisSpot.properties.images) {
      const imageBasemaps = thisSpot.properties.images.map(image => image.id);
      const imageBasemapChildrenSpots = searchedSpots.filter(
        spot => imageBasemaps.includes(spot.properties.image_basemap));
      childrenSpots.push(imageBasemapChildrenSpots);
    }
    // Find children spots based on strat section
    if (thisSpot.properties.sed && thisSpot.properties.sed.strat_section) {
      const stratSectionChildrenSpots = searchedSpots.filter(
        spot => thisSpot.properties.sed.strat_section.strat_section_id === spot.properties.strat_section_id);
      childrenSpots.push(stratSectionChildrenSpots);
    }
    // Find children spots not nested through geometry - nested directly in spot.properties.nesting
    if (thisSpot.properties.nesting) {
      let nonGeomChildrenSpots = [];
      thisSpot.properties.nesting.forEach((spotId) => {
        const spot = getSpotById(spotId);
        if (spot) nonGeomChildrenSpots.push(spot);
      });
      childrenSpots.push(nonGeomChildrenSpots);
    }
    childrenSpots = childrenSpots.flat();
    // Find active children spots (not Samples) based on geometry *Only polygon features can have children
    if (!thisSpot.properties.isSample
      && (thisSpot.geometry?.type === 'Polygon' || thisSpot.geometry?.type === 'MultiPolygon')) {
      const otherSpots = activeSpots.filter(
        spot => spot.geometry && spot.properties.id !== thisSpot.properties.id && !spot.properties?.isSample);
      otherSpots.forEach((spot) => {
        if (((isOnGeoMap(thisSpot) && isOnGeoMap(spot)) || isOnSameImageBasemap(thisSpot, spot)
          || isOnSameStratSection(thisSpot, spot)) && isWithin(spot, thisSpot)) childrenSpots.push(spot);
      });
    }
    return childrenSpots;
  };

  // Get the parents (not Samples) of an array of Spots
  const getParentsOfSpots = (spots1, activeSpots, allSpots) => {
    let allParentSpots = [];
    spots1.forEach((spot) => {
      const parentSpots = getParentSpots(spot, activeSpots, allSpots);
      if (!isEmpty(parentSpots)) allParentSpots.push(parentSpots);
    });
    return allParentSpots.flat();
  };

  // Get all the parent Spots of thisSpot, based on sample, image basemaps, strat sections and geometry
  // & also Spots stored in spot.properties.nesting not nested through geometry
  const getParentSpots = (thisSpot, activeSpots, allSpots) => {
    console.log('Getting Parent Spots...');
    let parentSpots = [];
    // Find parent spots based on sample
    if (thisSpot?.properties.isSample) {
      const parentSpot = getSpotWithThisSample(thisSpot.properties.id);
      if (!isEmpty(parentSpot)) parentSpots.push(parentSpot);
    }
    // Find parent spots based on image basemap
    if (thisSpot?.properties.image_basemap) {
      const parentImageBasemapSpot = allSpots.find(spot => spot.properties.images && spot.properties.images.find(
        image => image.id === thisSpot.properties.image_basemap));
      if (!isEmpty(parentImageBasemapSpot)) parentSpots.push(parentImageBasemapSpot);
    }
    // Find parent spots based on strat section
    if (thisSpot.properties.strat_section_id) {
      const parentStratSectionSpot = allSpots.find(
        spot => spot.properties?.sed?.strat_section?.strat_section_id === thisSpot.properties.strat_section_id);
      if (!isEmpty(parentStratSectionSpot)) parentSpots.push(parentStratSectionSpot);
    }
    // Find parent Spots not nested through geometry - nested directly in spot.properties.nesting
    const parentNonGeomSpot = allSpots.find(
      spot => spot.properties.nesting && spot.properties.nesting.includes(thisSpot.properties.id));
    if (!isEmpty(parentNonGeomSpot)) parentSpots.push(parentNonGeomSpot);
    parentSpots = parentSpots.flat();
    // Find active parent spots (not Samples) based on geometry *The parent must be a polygon
    if (thisSpot.geometry && !thisSpot.properties.isSample) {
      const otherSpots = activeSpots.filter(
        spot => spot.geometry && spot.properties.id !== thisSpot.properties.id && !spot.properties?.isSample);
      otherSpots.forEach((spot) => {
        if ((spot.geometry?.type === 'Polygon' || spot.geometry?.type === 'MultiPolygon')
          && ((isOnGeoMap(thisSpot) && isOnGeoMap(spot)) || isOnSameImageBasemap(thisSpot, spot)
            || isOnSameStratSection(thisSpot, spot)) && isWithin(thisSpot, spot)) parentSpots.push(spot);
      });
    }
    return parentSpots;
  };

  /* Exported Functions */

  // Get i generations of children spots for thisSpot. Children on an image basemap or strat section come from every
  // Dataset only if isAllDatasets, which the map leaves off so selecting there never picks up Spots it has not drawn
  const getChildrenGenerationsSpots = (thisSpot, i, isAllDatasets = false) => {
    const activeSpots = Object.values(getActiveSpotsObj());
    const searchedSpots = isAllDatasets ? Object.values(spots) : activeSpots;
    let childrenGenerations = [];
    let childSpots = [thisSpot];
    Array.from({length: i}, () => {
      childSpots = getChildrenOfSpots(childSpots, activeSpots, searchedSpots);
      // Remove a child Spot if already in the list of children generation Spots
      childSpots = childSpots.filter(childSpot => !childrenGenerations.flat().find(
        knownChildSpot => childSpot.properties.id === knownChildSpot.properties.id));
      if (!isEmpty(childSpots)) childrenGenerations.push(childSpots);
    });
    console.log('Found Children Generations:', childrenGenerations);
    return childrenGenerations;
  };

  // Get i generations of parent spots for thisSpot, from every Dataset except for those nested by geometry
  const getParentGenerationsSpots = (thisSpot, i) => {
    const activeSpots = Object.values(getActiveSpotsObj());
    const allSpots = Object.values(spots);
    let parentGenerations = [];
    let parentSpots = [thisSpot];
    Array.from({length: i}, () => {
      parentSpots = getParentsOfSpots(parentSpots, activeSpots, allSpots);
      // Remove a parent Spot if already in the list of parent generation Spots
      parentSpots = parentSpots.filter(parentSpot => !parentGenerations.flat().find(
        knownParentSpot => parentSpot.properties.id === knownParentSpot.properties.id));
      if (!isEmpty(parentSpots)) parentGenerations.push(parentSpots);
    });
    console.log('Found Parent Generations', parentGenerations);
    return parentGenerations;
  };

  return {
    getChildrenGenerationsSpots,
    getParentGenerationsSpots,
  };
};

export default useNesting;
