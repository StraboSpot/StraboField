import {Linking, Platform} from 'react-native';

import * as turf from '@turf/turf';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {SAMPLE_PAGE_BASE_URL} from './samples.constants';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {hasValidCoords} from '../maps/maps.helpers';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {
  addedNewSpotIdToDataset,
  addedSampleSpotIdToUpload,
  updatedModifiedTimestampsBySpotsIds,
} from '../project/projects.slice';
import useProject from '../project/useProject';
import {isOnGeoMap} from '../spots/spots.helpers';
import {clearedSelectedSpots, editedOrCreatedSpot, editedSpotProperties, setSelectedSpot} from '../spots/spots.slice';
import useSpots from '../spots/useSpots';

const useSamples = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const sampleSpotIdsToUpload = useSelector(state => state.project.sampleSpotIdsToUpload);
  const straboUserId = useSelector(state => state.user?.straboUserId);

  const {getTargetDatasetFromId} = useProject();
  const {deleteSpot, getRootSpotGeoCoords} = useSpots();
  const toast = useToast();

  /* Internal Functions */

  // A Sample Spot sits on the geo map, so it needs real world coordinates. A parent on an image basemap or strat
  // section has none of its own to give - its geometry is pixels - so fall back to the Spot holding that map, as
  // createSpot does. Undefined when there is no location to be had, which the notebook offers two ways to set.
  const getSampleGeometry = (parentSpot) => {
    const {image_basemap, lat, lng, strat_section_id} = parentSpot.properties;
    if (!isEmpty(lng) && !isEmpty(lat)) return turf.point([lng, lat]).geometry;
    if (!isOnGeoMap(parentSpot)) {
      const geoCoords = getRootSpotGeoCoords(image_basemap, strat_section_id);
      if (!geoCoords) return undefined;
      return turf.point(geoCoords).geometry;
    }
    if (!hasValidCoords(parentSpot)) return undefined;
    return parentSpot.geometry.type === 'Point' || parentSpot.geometry.type === 'LineString' ? parentSpot.geometry
      : turf.centroid(parentSpot).geometry;
  };

  /* Exported Functions */

  // Create new Sample Spot
  const createRichSample = (spot, selectedSample, sampleImages = []) => {
    // Nowhere to file the new Sample Spot without a target, so stop before anything is created rather than
    // leaving one behind in no dataset
    const targetDataset = getTargetDatasetFromId();
    if (isEmpty(targetDataset)) {
      toast.show('No Target Dataset. A target dataset needs to be set before creating a Sample.',
        {placement: 'top', type: 'warning'});
      return;
    }
    // A sample already on the parent Spot is a legacy sample being converted, so it was created with that Spot and
    // keeps the parent's created date. A brand new sample isn't on the parent Spot yet, so it gets today's date.
    const isConvertingLegacySample = spot.properties[PAGE_KEYS.SAMPLES]?.some(s => s.id === selectedSample.id);
    let d = isConvertingLegacySample && spot.properties.date ? new Date(spot.properties.date) : new Date(Date.now());
    d.setMilliseconds(0);

    const newEnrichedSample = {
      geometry: getSampleGeometry(spot),
      properties: {
        date: d.toISOString(),
        id: selectedSample.id,
        isSample: true,
        modified_timestamp: Date.now(),
        name: selectedSample.sample_id_name,
        samples: [selectedSample],
        time: d.toISOString(),
        ...(sampleImages.length > 0 && {images: sampleImages}),
      },
      type: 'Feature',
    };

    console.log('Creating new Enriched Sample:', newEnrichedSample);
    dispatch(addedNewSpotIdToDataset({datasetId: targetDataset.id, spotId: newEnrichedSample.properties.id}));
    dispatch(editedOrCreatedSpot(newEnrichedSample));
    if (Platform.OS !== 'web') dispatch(addedSampleSpotIdToUpload(newEnrichedSample.properties.id));

    // Modify current sample in Spot object to only have id of new Sample Spot
    let editedSample = {id: selectedSample.id};
    let samplesCopy = JSON.parse(JSON.stringify(spot.properties[PAGE_KEYS.SAMPLES] || []));
    console.log('Saving Sample data', editedSample, 'to Spot samples:', samplesCopy);
    const i = samplesCopy.findIndex(f => f.id === selectedSample.id);
    if (i === -1) samplesCopy.push(editedSample);
    else samplesCopy.splice(i, 1, editedSample);
    const spotId = spot.properties.id;
    dispatch(updatedModifiedTimestampsBySpotsIds([newEnrichedSample.properties.id, spotId]));
    dispatch(editedSpotProperties({field: PAGE_KEYS.SAMPLES, value: samplesCopy, spotId: spotId}));

    dispatch(setSelectedSpot(newEnrichedSample));
    dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    return newEnrichedSample;
  };

  const deleteRichSample = (sampleToDelete, parentSpot) => {
    console.log('Deleting Sample', sampleToDelete, 'from Spot', parentSpot);
    if (parentSpot) {
      const updatedSamples = parentSpot.properties?.samples?.filter(s => s.id !== sampleToDelete.properties.id);
      let updatedParentSpot = JSON.parse(JSON.stringify(parentSpot));
      if (isEmpty(updatedSamples)) delete updatedParentSpot.properties[PAGE_KEYS.SAMPLES];
      else updatedParentSpot.properties[PAGE_KEYS.SAMPLES] = updatedSamples;
      dispatch(
        editedSpotProperties({field: PAGE_KEYS.SAMPLES, value: updatedSamples, spotId: parentSpot.properties.id}));
      deleteSpot(sampleToDelete);

      dispatch(setSelectedSpot(updatedParentSpot));
      dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
    else {
      deleteSpot(sampleToDelete);
      dispatch(clearedSelectedSpots());
    }
  };

  // IGSNs are minted and sent to SESAR on strabospot.org, which can only work from what has been uploaded there.
  // A guest has no account to upload to.
  const openSamplePage = (sampleId) => {
    if (!straboUserId || sampleSpotIdsToUpload.includes(sampleId)) {
      alert('Upload Project First',
        'This sample, or its latest changes, is not on your StraboSpot account yet. Upload the project to your '
        + 'account first, then try again.');
    }
    else Linking.openURL(`${SAMPLE_PAGE_BASE_URL}/${straboUserId}/${sampleId}`);
  };

  return {
    createRichSample,
    deleteRichSample,
    openSamplePage,
  };
};

export default useSamples;
