import React from 'react';

import SectionDivider from '../../shared/ui/SectionDivider';
import {AddImageButtons, ImagesList} from '../images';

const SampleModalImages = ({sampleImages, setSampleImages}) => {

  const deleteImage = (imageToDelete) => {
    const imagesUpdated = sampleImages.filter(image => image.id !== imageToDelete.id);
    setSampleImages(imagesUpdated);
    return true;
  };

  const saveImagesToSample = (newImages) => {
    setSampleImages(prevState => ([...prevState, ...newImages]));
  };

  const saveUpdatedImage = (updatedImage) => {
    const i = sampleImages.findIndex(f => f.id === updatedImage.id);
    if (i === -1) setSampleImages(prevState => ([...prevState, updatedImage]));
    else {
      let imagesUpdated = JSON.parse(JSON.stringify(sampleImages));
      imagesUpdated.splice(i, 1, updatedImage);
      setSampleImages(imagesUpdated);
    }
  };

  return (
    <>
      <SectionDivider dividerText={'Images'}/>
      <AddImageButtons saveImages={saveImagesToSample}/>
      <ImagesList
        deleteImage={deleteImage}
        images={sampleImages}
        isThumbnailOnly
        saveImages={saveImagesToSample}
        saveUpdatedImage={saveUpdatedImage}
      />
    </>
  );
};

export default SampleModalImages;
