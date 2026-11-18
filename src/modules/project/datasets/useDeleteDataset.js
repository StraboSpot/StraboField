import {useToast} from 'react-native-toast-notifications';
import {useSelector} from 'react-redux';

import {getSamplesSplitByDataset} from '../../samples/samples.helpers';
import useSpots from '../../spots/useSpots';
import useProject from '../useProject';

// Deleting a dataset does what deleting each of its Spots would to samples filed across its edge, so no sample is
// left without a parent and no parent keeps a stub for a sample that is gone. Those samples are worked out from the
// Spots as they are before the delete, and tidied up only once it has gone, so a delete that fails leaves them be.
const useDeleteDataset = () => {
  /* Data Hooks */

  const spots = useSelector(state => state.spot.spots);

  const {destroyDataset, isAnythingReadOnly} = useProject();
  const {deleteSamplesSplitByDataset, isSpotReadOnly} = useSpots();
  const toast = useToast();

  /* Internal Functions */

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
  // whichever way the delete arrives. destroyDataset refuses a read only dataset itself.
  const deleteDataset = async (dataset) => {
    const {readOnlyMessage, ...samplesSplitByDataset} = getDatasetDeleteCheck(dataset);
    if (readOnlyMessage) {
      toast.show(`Unable to delete ${dataset.name}. ${readOnlyMessage}`, {placement: 'top', type: 'warning'});
      return false;
    }
    const isDeleted = await destroyDataset(dataset.id);
    if (isDeleted) deleteSamplesSplitByDataset(samplesSplitByDataset);
    return isDeleted;
  };

  // What deleting the dataset would do across its edge, which the confirmation names, and readOnlyMessage, which it
  // shows instead of offering Delete. Its samples filed elsewhere are deleted with it, and parents filed elsewhere
  // lose their stubs for samples in it.
  const getDatasetDeleteCheck = (dataset) => {
    const samplesSplitByDataset = getSamplesSplitByDataset(dataset, spots);
    return {...samplesSplitByDataset, readOnlyMessage: getReadOnlyMessage(samplesSplitByDataset)};
  };

  return {
    deleteDataset,
    getDatasetDeleteCheck,
  };
};

export default useDeleteDataset;
