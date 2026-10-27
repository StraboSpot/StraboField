import {useEffect, useRef, useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../shared/helpers';
import {setActiveModal} from '../home/home.slice';
import {deselectedAttributes, setSelectedAttributes} from '../spots/spots.slice';

// Which feature a list page has open in its detail view. The open feature is kept in the Redux selection too, so an
// edit made elsewhere hands the detail view back its updated record, and the detail view closes whenever that
// selection is dropped - another Spot selected, another page opened - rather than staying open over a feature that
// belongs somewhere else.
const useFeatureDetailView = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Local State */

  // The selection as this page last showed it, which is all it may drop as it closes
  const selectedAttributesRef = useRef(selectedAttributes);
  selectedAttributesRef.current = selectedAttributes;

  const [selectedFeature, setSelectedFeature] = useState({});

  /* Derived Variables */

  const isDetailView = !isEmpty(selectedFeature);

  /* Side Effects */

  useEffect(() => {
    return () => dispatch(deselectedAttributes(selectedAttributesRef.current));
  }, []);

  // While several features are selected for tagging, the list stays up to show them checked
  useEffect(() => {
    if (isEmpty(selectedAttributes)) setSelectedFeature({});
    else if (!isMultipleFeaturesTaggingEnabled) setSelectedFeature(selectedAttributes[0]);
  }, [selectedAttributes, spot]);

  /* Exported Functions */

  const closeDetailView = () => {
    setSelectedFeature({});
    dispatch(setSelectedAttributes([]));
  };

  const openDetailView = (feature) => {
    setSelectedFeature(feature);
    dispatch(setSelectedAttributes([feature]));
    dispatch(setActiveModal({modal: null}));
  };

  return {
    closeDetailView,
    isDetailView,
    openDetailView,
    selectedFeature,
  };
};

export default useFeatureDetailView;
