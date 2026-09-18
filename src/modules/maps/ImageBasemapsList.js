import React from 'react';
import {View} from 'react-native';

import {isEmpty} from '../../shared/helpers';
import ImagesList from '../images/ImagesList';
import useImages from '../images/useImages';
import ActiveDatasetsSummary from '../project/datasets/ActiveDatasetsSummary';
import useSpots from '../spots/useSpots';

const ImageBasemapsList = ({closeManMenuPanel, openDatasetsPage}) => {
  console.log('Rendering ImageBasemaps...');

  /* Data Hooks */

  const {getImageBasemap} = useImages();
  const {getActiveImageBasemaps} = useSpots();

  /* Derived Variables */

  const imageBasemaps = getActiveImageBasemaps();

  /* Event Handlers */

  const handleOpenImage = (image) => {
    closeManMenuPanel();
    getImageBasemap(image);
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <ActiveDatasetsSummary
        countText={!isEmpty(imageBasemaps)
          && `${imageBasemaps.length} ${imageBasemaps.length === 1 ? 'Image Basemap' : 'Image Basemaps'}`}
        openDatasetsPage={openDatasetsPage}
      />
      <ImagesList images={imageBasemaps} isThumbnailOnly onOpenImage={handleOpenImage}/>
    </View>
  );
};

export default ImageBasemapsList;
