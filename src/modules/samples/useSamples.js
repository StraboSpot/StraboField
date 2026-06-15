import * as turf from '@turf/turf';
import {useDispatch} from 'react-redux';

import {isEmpty} from '../../shared/helpers';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {addedNewSpotIdToDataset, updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import useProject from '../project/useProject';
import {useSpots} from '../spots';
import {clearedSelectedSpots, editedOrCreatedSpot, editedSpotProperties, setSelectedSpot} from '../spots/spots.slice';

const useSamples = () => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {getTargetDatasetFromId} = useProject();
  const {deleteSpot} = useSpots();


  /* Exported Functions */

  // Create new Sample Spot
  const createRichSample = (spot, selectedSample, sampleImages = []) => {
    let d = new Date(Date.now());
    d.setMilliseconds(0);
    let geometry = spot.geometry;
    if (spot.properties.lng && spot.properties.lat) {
      geometry = turf.point([spot.properties.lng, spot.properties.lat]).geometry;
    }
    else if (geometry.type !== 'Point' && geometry.type !== 'LineString') geometry = turf.centroid(spot).geometry;

    const newEnrichedSample = {
      geometry: geometry,
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
    const targetDataset = getTargetDatasetFromId();
    if (isEmpty(targetDataset)) {
      throw new Error('No Target Dataset. A target dataset needs to be set before creating Samples.');
    }
    dispatch(addedNewSpotIdToDataset({datasetId: targetDataset.id, spotId: newEnrichedSample.properties.id}));
    dispatch(editedOrCreatedSpot(newEnrichedSample));

    // Modify current sample in Spot object to only have id of new Sample Spot
    let editedSample = {id: selectedSample.id};
    let samplesCopy = JSON.parse(JSON.stringify(spot.properties[PAGE_KEYS.SAMPLES] || []));
    console.log('Saving Sample data', editedSample, 'to Spot samples:', samplesCopy);
    samplesCopy = samplesCopy.filter(f => f.id !== selectedSample.id);
    samplesCopy.push(editedSample);
    const spotId = spot.properties.id;
    dispatch(updatedModifiedTimestampsBySpotsIds([newEnrichedSample.properties.id, spotId]));
    dispatch(editedSpotProperties({field: PAGE_KEYS.SAMPLES, value: samplesCopy, spotId: spotId}));

    dispatch(setSelectedSpot(newEnrichedSample));
    dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
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

  const onSampleFormChange = (formCurrent, fieldName, fieldValue) => {
    console.log(fieldName, 'changed to', fieldValue);
    fieldName === 'collection_date'
      ? formCurrent.setFieldValue('collection_time', fieldValue)
      : fieldName === 'collection_time'
        ? formCurrent.setFieldValue('collection_date', fieldValue)
        : formCurrent.setFieldValue(fieldName, fieldValue);
  };

  return {
    createRichSample,
    deleteRichSample,
    onSampleFormChange,
  };
};

export default useSamples;
