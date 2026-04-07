import React from 'react';
import {FlatList, View} from 'react-native';

import {ImageCard, imageStyles, useImageThumbnails} from '.';
import ListEmptyText from '../../shared/ui/ListEmptyText';

const ImagesList = ({
                      deleteImage,
                      images,
                      isReadOnly,
                      isThumbnailOnly = false,
                      onOpenImage,
                    }) => {
  /* Data Hooks */

  const {
    areImageThumbnailsLoading,
    imageThumbnailURIs,
    setAreImageThumbnailsLoading,
    setImageThumbnailURIs,
  } = useImageThumbnails({images});

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
          setAreImageThumbnailsLoading={setAreImageThumbnailsLoading}
          setImageThumbnailURIs={setImageThumbnailURIs}
        />
      </React.Fragment>
    );
  };

  const renderImages = () => {
    const sortedImages = JSON.parse(JSON.stringify(images)).sort(
      (imgA, imgB) => (imgA?.title?.toString() || 'UntitledA')
        .localeCompare(imgB?.title?.toString() || 'UntitledB'));  // alphabetize by name
    return (
      <FlatList
        ListEmptyComponent={<ListEmptyText text={'No Images'}/>}
        ListHeaderComponent={
          <View
            style={[imageStyles.imagesListContainer, {justifyContent: isThumbnailOnly ? 'flex-start' : 'space-evenly'}]}
          >
            {sortedImages.map((image, index) => renderImageCard(image, index))}
          </View>
        }
        data={sortedImages}
      />
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      {renderImages()}
    </View>
  );
};

export default ImagesList;
