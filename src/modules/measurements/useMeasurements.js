import {useDispatch, useSelector} from 'react-redux';

import {getNewId, isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {COMPASS_TOGGLE_BUTTONS} from '../compass/compass.constants';
import {useForm} from '../form';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties, setSelectedAttributes} from '../spots/spots.slice';
import {useTags} from '../tags';

const useMeasurements = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const activeMeasurementTemplates = useSelector(state => state.project.project?.templates?.activeMeasurementTemplates)
    || [];
  const compassMeasurements = useSelector(state => state.compass.measurements);
  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getLabel} = useForm();
  const useMeasurementTemplates = useSelector(state => state.project.project?.templates?.useMeasurementTemplates);
  const {deleteFeatureTags} = useTags();

  /* Internal Functions */

  const removeMeasurementFromObj = (currentOrientationData, measurementToDelete) => {
    let aborted = false;
    let orientationDataCopy = JSON.parse(JSON.stringify(currentOrientationData));
    orientationDataCopy.forEach((measurement, i) => {
      if (measurementToDelete.id === measurement.id && !measurement.associated_orientation) orientationDataCopy[i] = {};
      else if (measurementToDelete.id === measurement.id && measurement.associated_orientation) {
        alert('Unable to Delete', 'Please delete the associated features before deleting the primary feature.');
        aborted = true;
        throw Error('Unable to delete a feature that has associated features.');
      }
      else if (measurement.associated_orientation) {
        measurement.associated_orientation.forEach((associatedMeasurement, j) => {
          if (measurementToDelete.id === associatedMeasurement.id) orientationDataCopy[i].associated_orientation[j] = {};
        });
        orientationDataCopy[i].associated_orientation = orientationDataCopy[i].associated_orientation.filter(
          associatedMeasurement => !isEmpty(associatedMeasurement));
      }
      if (measurement.associated_orientation && isEmpty(measurement.associated_orientation)) {
        delete orientationDataCopy[i].associated_orientation;
      }
    });
    if (!aborted) {
      orientationDataCopy = orientationDataCopy.filter(measurement => !isEmpty(measurement));
      return orientationDataCopy;
    }
  };

  /* Exported Functions */

  const createNewMeasurement = () => {
    let measurements = [];
    if (compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.PLANAR)) {
      let newPlanarMeasurement = {type: 'planar_orientation'};
      if (!compassMeasurements.manual) {
        newPlanarMeasurement = {
          ...newPlanarMeasurement,
          strike: compassMeasurements.strike,
          dip: compassMeasurements.dip,
          dip_direction: compassMeasurements.dip_direction,
          quality: compassMeasurements.quality,
        };
      }
      if (useMeasurementTemplates && !isEmpty(activeMeasurementTemplates)) {
        const planarTemplate = activeMeasurementTemplates.find(t => t.values?.type === 'planar_orientation'
          || t.type === 'planar_orientation');
        if (!isEmpty(planarTemplate)) Object.assign(newPlanarMeasurement, planarTemplate.values);
        else {
          const tabularTemplate = activeMeasurementTemplates.find(t => t.values?.type === 'tabular_orientation'
            || t.subType === 'tabular_orientation');
          if (!isEmpty(tabularTemplate)) {
            newPlanarMeasurement.type = 'tabular_orientation';
            Object.assign(newPlanarMeasurement, tabularTemplate.values);
          }
        }
      }
      measurements.push(newPlanarMeasurement);
    }
    if (compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.LINEAR)) {
      let newLinearMeasurement = {type: 'linear_orientation'};
      if (!compassMeasurements.manual) {
        newLinearMeasurement = {
          ...newLinearMeasurement,
          trend: compassMeasurements.trend,
          plunge: compassMeasurements.plunge,
          rake: compassMeasurements.rake,
          rake_calculated: 'yes',
          quality: compassMeasurements.quality,
        };
      }
      if (useMeasurementTemplates && !isEmpty(activeMeasurementTemplates)) {
        const linearTemplate = activeMeasurementTemplates.find(t => t.values?.type === 'linear_orientation'
          || t.type === 'linear_orientation');
        if (!isEmpty(linearTemplate)) Object.assign(newLinearMeasurement, linearTemplate.values);
      }
      measurements.push(newLinearMeasurement);
    }

    if (measurements.length > 0) {
      let newOrientation = measurements[0];
      newOrientation.id = getNewId();
      if (measurements.length > 1) {
        let newAssociatedOrientation = measurements[1];
        newAssociatedOrientation.id = getNewId();
        while (newOrientation.id === newAssociatedOrientation.id) newAssociatedOrientation.id = getNewId();
        newOrientation.associated_orientation = [newAssociatedOrientation];
      }

      const orientations = !spot.properties.orientation_data ? [newOrientation]
        : [...spot.properties.orientation_data, newOrientation];
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'orientation_data', value: orientations}));

      if (compassMeasurements.manual) {
        dispatch(setSelectedAttributes([newOrientation]));
        dispatch(setNotebookPageVisible(PAGE_KEYS.MEASUREMENTS));
      }
    }
    else alert('No Measurement Type', 'Please select a measurement type using the toggles.');
  };

  const deleteMeasurements = (measurementsToDelete) => {
    console.log('Deleting measurements...', measurementsToDelete);
    let flattenedMeasurementsToDelete = measurementsToDelete.reduce((acc, meas) => {
      if (meas.associated_orientation) {
        const assocOrientations = meas.associated_orientation.reduce((acc1, aO) => [...acc1, aO], []);
        return [...acc, ...assocOrientations, meas];
      }
      else return [...acc, meas];
    }, []);

    let updatedOrientationData = JSON.parse(JSON.stringify(spot.properties.orientation_data));
    flattenedMeasurementsToDelete.forEach((measurementToDelete) => {
      updatedOrientationData = removeMeasurementFromObj(updatedOrientationData, measurementToDelete);
    });
    // Only after the loop, which throws and deletes nothing if a feature has associated features - otherwise the
    // tags would be dropped while the measurements they point at are still there.
    deleteFeatureTags(measurementsToDelete);
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'orientation_data', value: updatedOrientationData}));
    dispatch(setSelectedAttributes([]));
  };

  const getMeasurementLabel = (key) => {
    return getLabel(key, ['measurement']);
  };

  return {
    createNewMeasurement,
    deleteMeasurements,
    getMeasurementLabel,
  };
};

export default useMeasurements;
