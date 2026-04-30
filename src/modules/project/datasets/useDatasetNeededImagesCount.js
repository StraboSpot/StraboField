import {useCallback, useEffect, useState} from 'react';
import {Platform} from 'react-native';

import {useSelector} from 'react-redux';

import {useImages} from '../../images';

const useDatasetNeededImagesCount = (dataset) => {
  const spots = useSelector(state => state.spot.spots);

  const {gatherNeededImages} = useImages();

  const [neededImagesCount, setNeededImagesCount] = useState(0);

  const computeCount = useCallback(async () => {
    if (Platform.OS !== 'web') {
      const datasetSpots = (dataset.spotIds || []).map(id => spots[id]).filter(Boolean);
      const result = await gatherNeededImages(datasetSpots, dataset);
      setNeededImagesCount(result?.neededImagesIds?.length || 0);
    }
  }, [dataset.id]);

  useEffect(() => {
    computeCount();
  }, [dataset.id]);

  return [neededImagesCount, computeCount];
};

export default useDatasetNeededImagesCount;
