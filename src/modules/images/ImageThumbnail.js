import React from 'react';
import {ActivityIndicator, Platform, Text} from 'react-native';

import {Image} from '@rn-vui/base';

import {imageStyles, PlaceholderImageIcon} from '.';
import {WARNING_COLOR} from '../../shared/styles.constants';

const ImageThumbnail = ({
                          imageThumbnailURI,
                          isConnected,
                          isInternetReachable,
                          isImageMissingOnServer,
                          isImageThumbnailLoading,
                          isThumbnailOnly,
                          onFinishedLoading,
                          onImagePressed,
                        }) => {
  /* Derived Variables */

  const height = isThumbnailOnly && Platform.OS === 'web' ? 85 : isThumbnailOnly ? 90 : 150;

  /* View */

  return (
    <Image
      PlaceholderContent={isImageThumbnailLoading ? <ActivityIndicator/>
        : isImageMissingOnServer
          ? <Text style={{color: WARNING_COLOR, textAlign: 'center'}}>Image Not Found On Server</Text>
          : <PlaceholderImageIcon isConnected={isConnected} isInternetReachable={isInternetReachable}/>}
      containerStyle={[imageStyles.thumbnailImageContainer, {height: height, width: height}]}
      onError={onFinishedLoading}
      onLoadEnd={onFinishedLoading}
      onPress={onImagePressed}
      placeholderStyle={[imageStyles.placeholderImage, {height: height, width: height}]}
      pressableProps={{disabled: !isInternetReachable}}
      source={imageThumbnailURI && {uri: imageThumbnailURI}}
    />
  );
};

export default React.memo(ImageThumbnail);
