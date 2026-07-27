import {useState} from 'react';

import {useSelector} from 'react-redux';

import {isEmpty, isEqual} from '../../../shared/helpers';
import useMapFeatures from '../features/useMapFeatures';
import useMapCoords from '../view/useMapCoords';

// Owns the selected/not-selected Spots rendered on the map. The two setters partition Spots into those
// buckets; the WhileEditing variant keeps the in-progress edit separate from the rest.
const useMapDisplayedSpots = () => {
  /* Data Hooks */

  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const stratSection = useSelector(state => state.map.stratSection);

  const {convertImagePixelsToLatLong} = useMapCoords();
  const {getDisplayedSpots} = useMapFeatures();

  /* Local State */

  const [spotsNotSelected, setSpotsNotSelected] = useState([]);
  const [spotsSelected, setSpotsSelected] = useState([]);

  /* Functions */

  // Set selected and not selected Spots to display when not editing
  const setDisplayedSpots = (selectedSpots) => {
    let [selectedDisplayedSpots, notSelectedDisplayedSpots] = getDisplayedSpots(selectedSpots);

    // Convert image pixels to lat, lng (deep copy first to avoid mutating Redux state)
    if (currentImageBasemap || stratSection) {
      selectedDisplayedSpots = JSON.parse(JSON.stringify(selectedDisplayedSpots)).map(
        spot => convertImagePixelsToLatLong(spot));
      notSelectedDisplayedSpots = JSON.parse(JSON.stringify(notSelectedDisplayedSpots)).map(
        spot => convertImagePixelsToLatLong(spot));
    }

    if (!isEqual(spotsSelected, selectedDisplayedSpots)) {
      console.log('Selected Spots:', selectedDisplayedSpots);
      setSpotsSelected(selectedDisplayedSpots);
    }
    if (!isEqual(spotsNotSelected, notSelectedDisplayedSpots)) {
      console.log('Not Selected Spots:', notSelectedDisplayedSpots);
      setSpotsNotSelected(notSelectedDisplayedSpots);
    }
  };

  // Set selected and not selected Spots to display while editing
  const setDisplayedSpotsWhileEditing = (spotEditingTmp, spotsEditedTmp, spotsNotEditedTmp) => {
    if (!isEmpty(spotEditingTmp)) {
      spotsNotEditedTmp = spotsNotEditedTmp.filter(spot => spot.properties.id !== spotEditingTmp.properties.id);
    }
    console.log('Set displayed Spots while editing. Editing:', spotEditingTmp, 'Edited:', spotsEditedTmp, 'Not edited:',
      spotsNotEditedTmp);

    let spotsEditedCopy = JSON.parse(JSON.stringify(isEmpty(spotsEditedTmp) ? [] : spotsEditedTmp));
    let spotsNotEditedCopy = JSON.parse(JSON.stringify(isEmpty(spotsNotEditedTmp) ? [] : spotsNotEditedTmp));
    let spotEditingCopy = JSON.parse(JSON.stringify(isEmpty(spotEditingTmp) ? [] : [{...spotEditingTmp}]));

    // Convert image pixels to lat, lng
    if (currentImageBasemap || stratSection) {
      spotsEditedCopy = spotsEditedCopy.map(spot => convertImagePixelsToLatLong(spot));
      spotsNotEditedCopy = spotsNotEditedCopy.map(spot => convertImagePixelsToLatLong(spot));
      spotEditingCopy = spotEditingCopy.map(spot => convertImagePixelsToLatLong(spot));
    }

    console.log('Selected Edit Features:', spotEditingCopy);
    setSpotsSelected(isEmpty(spotEditingCopy) ? [] : spotEditingCopy);
    console.log('Unselected Edit Features:', [...spotsEditedCopy, ...spotsNotEditedCopy]);
    setSpotsNotSelected([...spotsEditedCopy, ...spotsNotEditedCopy]);
  };

  return {
    setDisplayedSpots,
    setDisplayedSpotsWhileEditing,
    spotsNotSelected,
    spotsSelected,
  };
};

export default useMapDisplayedSpots;
