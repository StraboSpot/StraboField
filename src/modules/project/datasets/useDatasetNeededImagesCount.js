import {useCallback, useEffect, useState} from 'react';
import {Platform} from 'react-native';

import {useSelector} from 'react-redux';

import useImages from '../../images/useImages';
import {getImagesCount} from '../../spots/spots.helpers';

const useDatasetNeededImagesCount = (dataset) => {
  const spots = useSelector(state => state.spot.spots);

  const {gatherNeededImages} = useImages();

  const [neededImagesCount, setNeededImagesCount] = useState(0);

  // The total shown beside the needed count, which is checked again whenever it changes so the two agree
  const imagesCount = getImagesCount(dataset.spotIds, spots);

  const computeCount = useCallback(async () => {
    if (Platform.OS !== 'web') {
      const datasetSpots = (dataset.spotIds || []).map(id => spots[id]).filter(Boolean);
      const result = await gatherNeededImages(datasetSpots, dataset);
      setNeededImagesCount(result?.neededImagesIds?.length || 0);
    }
  }, [dataset.id, imagesCount]);

  useEffect(() => {
    computeCount();
  }, [computeCount]);

  return [neededImagesCount, computeCount, imagesCount];
};

export default useDatasetNeededImagesCount;
