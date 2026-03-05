import React, {useMemo} from 'react';
import {View} from 'react-native';

import {ImageCard, useImages, useImageThumbnails} from '../images';

const NestingImageCard = ({imageBasemapId, index}) => {
  /* Data Hooks */

  const {getImageByImageId} = useImages();
  const image = getImageByImageId(imageBasemapId);
  const images = useMemo(() => [image], [image]);
  const {
    areImageThumbnailsLoading, imageThumbnailURIs, setAreImageThumbnailsLoading, setImageThumbnailURIs,
  } = useImageThumbnails({images});


  /* View */

  if (image) {
    return (
      <View style={{alignSelf: 'center'}}>
        <ImageCard
          areImageThumbnailsLoading={areImageThumbnailsLoading}
          image={image}
          imageThumbnailURIs={imageThumbnailURIs}
          index={index}
          isThumbnailOnly
          setAreImageThumbnailsLoading={setAreImageThumbnailsLoading}
          setImageThumbnailURIs={setImageThumbnailURIs}
        />
      </View>
    );
  }
};

export default NestingImageCard;
