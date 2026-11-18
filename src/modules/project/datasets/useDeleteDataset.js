import {useToast} from 'react-native-toast-notifications';
import {useSelector} from 'react-redux';

import {getSamplesSplitByDataset} from '../../samples/samples.helpers';
import useSpots from '../../spots/useSpots';
import useProject from '../useProject';

// Deleting a dataset does what deleting each of its Spots would to samples filed across its edge, so no sample is
// left without a parent and no parent keeps a stub for a sample that is gone. Those samples are worked out from the
// Spots as they are before the delete, and tidied up only once it has gone, so a delete that fails leaves them be.
const useDeleteDataset = () => {
  const spots = useSelector(state => state.spot.spots);

  const {destroyDataset} = useProject();
  const {deleteSamplesSplitByDataset, getDatasetDeleteReadOnlyMessage} = useSpots();
  const toast = useToast();

  // Whether the dataset was deleted. The confirmation has already said why not, but nothing read only may change
  // whichever way the delete arrives. destroyDataset refuses a read only dataset itself.
  const deleteDataset = async (dataset) => {
    const samplesSplitByDataset = getSamplesSplitByDataset(dataset, spots);
    const readOnlyMessage = getDatasetDeleteReadOnlyMessage(samplesSplitByDataset);
    if (readOnlyMessage) {
      toast.show(`Unable to delete ${dataset.name}. ${readOnlyMessage}`, {placement: 'top', type: 'warning'});
      return false;
    }
    const isDeleted = await destroyDataset(dataset.id);
    if (isDeleted) deleteSamplesSplitByDataset(samplesSplitByDataset);
    return isDeleted;
  };

  return deleteDataset;
};

export default useDeleteDataset;
