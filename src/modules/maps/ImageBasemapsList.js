import React, {useContext} from 'react';
import {View} from 'react-native';

import {isEmpty} from '../../shared/helpers';
import ImagesList from '../images/ImagesList';
import useImages from '../images/useImages';
import {LeavePageContext} from '../notebook-panel/LeavePageContext';
import ActiveDatasetsSummary from '../project/datasets/ActiveDatasetsSummary';
import useSpots from '../spots/useSpots';

const ImageBasemapsList = ({closeManMenuPanel, openDatasetsPage}) => {
  console.log('Rendering ImageBasemaps...');

  /* Data Hooks */

  const {confirmLeavePage, hasUnsavedPageChanges} = useContext(LeavePageContext);

  const {getImageBasemap} = useImages();
  const {getActiveImageBasemaps} = useSpots();

  /* Derived Variables */

  const imageBasemaps = getActiveImageBasemaps();

  /* Event Handlers */

  // Opening a basemap clears the selected Spot, which leaves the notebook page on screen
  const handleOpenImage = async (image) => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
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
