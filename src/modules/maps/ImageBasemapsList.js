import React from 'react';

import {ImagesList, useImages} from '../images';
import {useSpots} from '../spots';

const ImageBasemapsList = ({closeManMenuPanel}) => {
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

  return <ImagesList images={imageBasemaps} isThumbnailOnly onOpenImage={handleOpenImage}/>;
};

export default ImageBasemapsList;
