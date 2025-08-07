import React from 'react';
import {Platform, ActivityIndicator} from 'react-native';

import {Image} from '@rn-vui/base';

import {imageStyles, PlaceholderImageIcon} from '.';

const ImageThumbnail = ({
                          imageThumbnailURI,
                          isImageThumbnailLoading,
                          isThumbnailOnly,
                          onFinishedLoading,
                          onImagePressed,
                        }) => {

  const height = isThumbnailOnly && Platform.OS === 'web' ? 87 : isThumbnailOnly ? 90 : 150;

  return (
    <Image
      PlaceholderContent={isImageThumbnailLoading ? <ActivityIndicator/> : <PlaceholderImageIcon/>}
      containerStyle={[imageStyles.thumbnailImageContainer, {height: height, width: height}]}
      onError={onFinishedLoading}
      onLoadEnd={onFinishedLoading}
      onPress={onImagePressed}
      placeholderStyle={[imageStyles.placeholderImage, {height: height, width: height}]}
      source={imageThumbnailURI && {uri: imageThumbnailURI}}
    />
  );
};

export default ImageThumbnail;
