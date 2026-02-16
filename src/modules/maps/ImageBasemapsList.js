import React from 'react';

import {ImagesList, useImages} from '../images';
import {useSpots} from '../spots';

const ImageBasemapsList = ({closeManMenuPanel}) => {
  console.log('Rendering ImageBasemaps...');

  /* Data Hooks / State */

  const {getImageBasemap} = useImages();
  const {getActiveImageBasemaps} = useSpots();

  /* Derived Variables */

  const imageBasemaps = getActiveImageBasemaps();

  /* Logic Helpers */

  const openImage = (image) => {
    closeManMenuPanel();
    getImageBasemap(image);
  };

  /* View */

  return <ImagesList images={imageBasemaps} isThumbnailOnly openImage={openImage}/>;
};

export default ImageBasemapsList;
