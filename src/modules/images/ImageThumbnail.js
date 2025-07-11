import React, {useEffect, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';

import {Image} from '@rn-vui/base';

import {imageStyles, useImages} from './index';
import placeholderImage from '../../assets/images/noimage.jpg';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {useSpots} from '../spots';

const ImageThumbnail = ({handleImagePressed, imageId}) => {

  const {getImageThumbnailURIs} = useImages();
  const {getSpotsWithImages} = useSpots();

  const [imageThumbnails, setImageThumbnails] = useState({});
  const [isImageLoadedObj, setIsImageLoadedObj] = useState({});

  useEffect(() => {
    console.log('UE ImageThumbnail []');
    loadImageThumbnailURIs().catch(err => console.error(err));
  }, []);

  const loadImageThumbnailURIs = async () => {
    try {
      console.log('Getting Image URI Thumbnails!');
      const spotsWithImages = getSpotsWithImages();
      let imageThumbnailURIsTemp = {};
      await Promise.all(spotsWithImages.map(async (spot) => {
        const gotImageThumbnailURIs = await getImageThumbnailURIs(spot.properties.images);
        imageThumbnailURIsTemp = {...imageThumbnailURIsTemp, ...gotImageThumbnailURIs};
      }));
      setIsImageLoadedObj(Object.assign({}, ...Object.keys(imageThumbnailURIsTemp).map(key => ({[key]: false}))));
      console.log('Image URI Thumbnails are done!');
      setImageThumbnails(imageThumbnailURIsTemp);
    }
    catch (err) {
      console.error('Error getting image thumbnail URIs', err);
    }
  };

  return (
    <View style={imageStyles.thumbnailContainer}>
      <Image
        style={imageStyles.thumbnail}
        onPress={handleImagePressed}
        source={imageThumbnails[imageId] ? {uri: imageThumbnails[imageId]} : placeholderImage}
        PlaceholderContent={isEmpty(isImageLoadedObj) || !isImageLoadedObj[imageId] ? <ActivityIndicator/>
          : <Image style={imageStyles.thumbnail} source={placeholderImage}/>}
        placeholderStyle={commonStyles.imagePlaceholder}
        onError={() => {
          if (!isImageLoadedObj[imageId]) setIsImageLoadedObj(j => ({...j, [imageId]: true}));
        }}
        onLoadEnd={() => {
          if (!isImageLoadedObj[imageId]) setIsImageLoadedObj(j => ({...j, [imageId]: true}));
        }}
      />
    </View>
  );
};

export default ImageThumbnail;
