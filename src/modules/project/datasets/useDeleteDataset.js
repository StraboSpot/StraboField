import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/helpers';
import {getSamplesSplitByDataset} from '../../samples/samples.helpers';
import {deletedSpots} from '../../spots/spots.slice';
import useSpots from '../../spots/useSpots';
import {deletedDataset, deletedSpotIdsFromReports, deletedSpotIdsFromTags} from '../projects.slice';
import useProject from '../useProject';

// Deleting a dataset does what deleting each of its Spots would: they come out of the tags and memos holding them,
// and samples filed across its edge go with them, so no sample is left without a parent and no parent keeps a stub
// for a sample that is gone. Those samples are worked out from the Spots as they are before the delete, and a delete
// refused for being read only leaves them be.
const useDeleteDataset = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const datasets = useSelector(state => state.project.datasets);
  const spots = useSelector(state => state.spot.spots);

  const {isAnythingReadOnly, isReadOnlyDataset} = useProject();
  const {deleteSamplesSplitByDataset, isSpotReadOnly} = useSpots();
  const toast = useToast();

  /* Internal Functions */

  // The dataset as it is now. The one passed in can be a copy taken when its page opened, and the Spots deleted and
  // the samples found across its edge must come from the same list.
  const getCurrentDataset = dataset => datasets[dataset.id] || dataset;

  // Why deleting the dataset would change a read only Spot in another dataset, or null if it wouldn't
  const getReadOnlyMessage = ({parentsToUnlink, samplesToDelete}) => {
    if (!isAnythingReadOnly) return null;
    const readOnlySample = samplesToDelete.find(isSpotReadOnly);
    if (readOnlySample) {
      return `Sample ${readOnlySample.properties.name}, taken at a Spot in this dataset, is read only.`;
    }
    const readOnlyParent = parentsToUnlink.find(({parentSpot}) => isSpotReadOnly(parentSpot))?.parentSpot;
    if (readOnlyParent) {
      return `Spot ${readOnlyParent.properties.name}, which a Sample in this dataset was taken from, is read only.`;
    }
    return null;
  };

  /* Exported Functions */

  // Whether the dataset was deleted. The confirmation has already said why not, but nothing read only may change
  // whichever way the delete arrives.
  const deleteDataset = (dataset) => {
    if (isReadOnlyDataset(dataset.id)) {
      toast.show(`${dataset.name} is read only, so it can't be deleted.`, {placement: 'top', type: 'warning'});
      return false;
    }
    const {readOnlyMessage, ...samplesSplitByDataset} = getDatasetDeleteCheck(dataset);
    if (readOnlyMessage) {
      toast.show(`Unable to delete ${dataset.name}. ${readOnlyMessage}`, {placement: 'top', type: 'warning'});
      return false;
    }
    const spotIds = getCurrentDataset(dataset).spotIds;
    if (!isEmpty(spotIds)) {
      console.log(spotIds.length, 'Spot(s) in Dataset to Delete.');
      // Ahead of the dataset itself, since on web deleting it sends the project to the server as it then is.
      // The Spots' image files are kept on purpose. Auto saves, and saves made without images, hold no image
      // files and take them from the shared images folder when restored, so deleting them here would lose any
      // never uploaded from a restore of the project as it was before this delete.
      dispatch(deletedSpotIdsFromReports(spotIds));
      dispatch(deletedSpotIdsFromTags(spotIds));
      dispatch(deletedSpots(spotIds));
    }
    dispatch(deletedDataset(dataset.id));
    deleteSamplesSplitByDataset(samplesSplitByDataset);
    return true;
  };

  // What deleting the dataset would do across its edge, which the confirmation names, and readOnlyMessage, which it
  // shows instead of offering Delete. Its samples filed elsewhere are deleted with it, and parents filed elsewhere
  // lose their stubs for samples in it.
  const getDatasetDeleteCheck = (dataset) => {
    const samplesSplitByDataset = getSamplesSplitByDataset(getCurrentDataset(dataset), spots);
    return {...samplesSplitByDataset, readOnlyMessage: getReadOnlyMessage(samplesSplitByDataset)};
  };

  return {
    deleteDataset,
    getDatasetDeleteCheck,
  };
};

export default useDeleteDataset;
