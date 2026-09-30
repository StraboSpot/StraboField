import {useSelector} from 'react-redux';

import {getChildSpots, getGenerations, getParentSpots} from './nesting.helpers';
import useSpots from '../spots/useSpots';

const useNesting = () => {
  /* Data Hooks */

  const spots = useSelector(state => state.spot.spots);

  const {getActiveSpotsObj} = useSpots();

  /* Exported Functions */

  // Get up to levels generations of children of thisSpot. Children nested by geometry come only from the active
  // Datasets, and so do those on an image basemap or strat section unless isAllDatasets. The map leaves it off, so
  // selecting there never picks up Spots it has not drawn.
  const getChildrenGenerationsSpots = (thisSpot, levels, isAllDatasets = false) => {
    const activeSpots = Object.values(getActiveSpotsObj());
    const searchedSpots = isAllDatasets ? Object.values(spots) : activeSpots;
    const childrenGenerations = getGenerations(thisSpot, levels,
      spot => getChildSpots(spot, {activeSpots, searchedSpots, spots}));
    console.log('Found Children Generations:', childrenGenerations);
    return childrenGenerations;
  };

  // Get up to levels generations of parents of thisSpot, from every Dataset except for those nested by geometry
  const getParentGenerationsSpots = (thisSpot, levels) => {
    const activeSpots = Object.values(getActiveSpotsObj());
    const allSpots = Object.values(spots);
    const parentGenerations = getGenerations(thisSpot, levels, spot => getParentSpots(spot, {activeSpots, allSpots}));
    console.log('Found Parent Generations', parentGenerations);
    return parentGenerations;
  };

  return {
    getChildrenGenerationsSpots,
    getParentGenerationsSpots,
  };
};

export default useNesting;
