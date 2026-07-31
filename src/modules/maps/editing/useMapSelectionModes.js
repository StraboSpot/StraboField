import {useDispatch} from 'react-redux';

import alert from '../../../shared/ui/alert';
import {setModalVisible} from '../../home/home.slice';
import {MODAL_KEYS} from '../../page/pageKeys.constants';
import useProject from '../../project/useProject';
import {setIntersectedSpotsForTagging} from '../../spots/spots.slice';
import useMapFeaturesCalculated from '../features/useMapFeaturesCalculated';
import useStereonet from '../useStereonet';

// In a "selecting" mode, a finished draw lassos existing Spots for a report/stereonet/inspect/tag action
// instead of creating a new Spot.
const useMapSelectionModes = ({mapRef, spotsNotSelected}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {getLassoedSpots} = useMapFeaturesCalculated(mapRef);
  const {getStereonet} = useStereonet();
  const {isReadOnlySpot} = useProject();

  /* Functions */

  const getStereonetForFeature = async (feature) => {
    const selectedSpots = getLassoedSpots(spotsNotSelected, feature);
    console.log('Selected Spots', selectedSpots);
    await getStereonet(selectedSpots);
  };

  const selectReports = (feature) => {
    const selectedSpots = getLassoedSpots(spotsNotSelected, feature);
    if (selectedSpots.length > 0) {
      dispatch(setIntersectedSpotsForTagging(selectedSpots));
      dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.ADD_SPOTS_TO_REPORTS}));
    }
    else {
      alert(
        'Error!',
        'No Spots selected.',
      );
    }
  };

  const selectSpotsForRawData = (feature) => {
    let selectedSpots = [];
    selectedSpots = getLassoedSpots(spotsNotSelected, feature);
    console.log('Selected Spots', selectedSpots);
    if (selectedSpots.length > 0) {
      dispatch(setIntersectedSpotsForTagging(selectedSpots));
      dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.INSPECT_SPOTS_RAW_DATA}));
    }
    else console.warn('No Spots selected.');
  };

  const selectSpotsForTagging = (feature) => {
    const selectedSpots = getLassoedSpots(spotsNotSelected, feature);

    // Filter out Read Only Spots
    const selectedSpotsFiltered = selectedSpots.filter((spot) => {
      if (spot?.properties?.id && !isReadOnlySpot(spot.properties.id)) return spot;
    });

    if (selectedSpotsFiltered.length > 0) {
      dispatch(setIntersectedSpotsForTagging(selectedSpotsFiltered));
      dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.ADD_TAGS_TO_SPOTS}));
    }
    else if (selectedSpots.length > 0) {
      alert(
        'Error!',
        'Only Read Only Spots Selected',
      );
    }
    else {
      alert(
        'Error!',
        'No Spots Selected',
      );
    }
  };

  // Route a finished draw feature to the active selecting mode; returns true when a mode consumed it (false =
  // caller should create a Spot). 'selectSpots' is freehand-only, so handling it on both draw paths is safe.
  const applySelectingMode = async (feature, selectingMode) => {
    if (selectingMode === 'report') selectReports(feature);
    else if (selectingMode === 'stereonet') await getStereonetForFeature(feature);
    else if (selectingMode === 'selectSpots') selectSpotsForRawData(feature);
    else if (selectingMode === 'tag') selectSpotsForTagging(feature);
    else return false;
    return true;
  };

  return {applySelectingMode};
};

export default useMapSelectionModes;
