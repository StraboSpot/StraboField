import React from 'react';
import {View} from 'react-native';

import {ImageCard, imageStyles, useImageThumbnails} from '.';
import ListEmptyText from '../../shared/ui/ListEmptyText';

const ImagesList = ({
                      deleteImage,
                      images,
                      isReadOnly,
                      isThumbnailOnly = false,
                      onOpenImage,
                      onPressEmpty,
                      saveUpdatedImage,
                      spotWithImage,
                    }) => {
  /* Data Hooks */

  const {
    areImageThumbnailsLoading,
    imageThumbnailURIs,
    setAreImageThumbnailsLoading,
    setImageThumbnailURIs,
  } = useImageThumbnails({images});

  /* Derived Variables */

  const sortedImages = JSON.parse(JSON.stringify(images)).sort(
    (imgA, imgB) => (imgA?.title?.toString() || 'UntitledA')
      .localeCompare(imgB?.title?.toString() || 'UntitledB'));  // alphabetize by name

  /* Render Functions */

  const renderImageCard = (image, index) => {
    return (
      <React.Fragment key={image.id}>
        <ImageCard
          areImageThumbnailsLoading={areImageThumbnailsLoading}
          image={image}
          imageThumbnailURIs={imageThumbnailURIs}
          index={index}
          isReadOnly={isReadOnly}
          isThumbnailOnly={isThumbnailOnly}
          onOpenImage={onOpenImage}
          saveUpdatedImage={saveUpdatedImage}
          setAreImageThumbnailsLoading={setAreImageThumbnailsLoading}
          setImageThumbnailURIs={setImageThumbnailURIs}
          spotWithImage={spotWithImage}
        />
      </React.Fragment>
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      {sortedImages.length === 0 ? <ListEmptyText onPress={onPressEmpty} text={'No Images'}/>
        : (
          <View
            style={[imageStyles.imagesListContainer, {justifyContent: isThumbnailOnly ? 'flex-start' : 'space-evenly'}]}
          >
            {sortedImages.map((image, index) => renderImageCard(image, index))}
          </View>
        )
      }
    </View>
  );
};

export default ImagesList;
