import React from 'react';

import {ImagesList, useImages} from '../images';
import {useSpots} from '../spots';

const ImageBasemapsList = ({closeManMenuPanel}) => {
  console.log('Rendering ImageBasemaps...');

  const {getActiveImageBasemaps} = useSpots();
  const {getImageBasemap} = useImages();

  const imageBasemaps = getActiveImageBasemaps();

  const openImage = (image) => {
    closeManMenuPanel();
    getImageBasemap(image);
  };

  return <ImagesList images={imageBasemaps} isThumbnailOnly openImage={openImage}/>;
};

export default ImageBasemapsList;
