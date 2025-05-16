import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Platform, Text, View} from 'react-native';

import {Image} from '@rn-vui/base';

import placeholderImage from '../../assets/images/noimage.jpg';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {imageStyles, useImages} from '../images';
import {useSpots} from '../spots';

const ImageBasemapsList = ({closeManMenuPanel}) => {
  console.log('Rendering ImageBasemaps...');

  const {getImageBasemaps} = useSpots();
  const {getImageBasemap, getImageThumbnailURI, getLocalImageURI} = useImages();

  const [isImageLoadedObj, setIsImageLoadedObj] = useState({});

  const imageBasemaps = useMemo(() => {
    console.log('UM ImageBasemaps []');
    const gotImageBasemaps = getImageBasemaps();
    console.log('Image Basemaps:', gotImageBasemaps);
    return gotImageBasemaps;
  }, []);

  useEffect(() => {
    console.log('UE ImageBasemaps []');
    setIsImageLoadedObj(Object.assign({}, ...imageBasemaps.map(b => ({[b.id]: false}))));
  }, []);

  const handleImagePressed = (image) => {
    closeManMenuPanel();
    getImageBasemap(image);
  };

  const renderImageBasemapThumbnail = (image) => {
    const uri = Platform.OS === 'web' ? getImageThumbnailURI(image.id) : getLocalImageURI(image.id);
    return (
      <View style={imageStyles.thumbnailContainer}>
        <Text>{image.title}</Text>
        <Image
          source={{uri: uri}}
          style={imageStyles.thumbnail}
          resizeMode={'contain'}
          PlaceholderContent={isEmpty(isImageLoadedObj) || !isImageLoadedObj[image.id] ? <ActivityIndicator/>
            : <Image style={imageStyles.thumbnail} source={placeholderImage}/>}
          placeholderStyle={commonStyles.imagePlaceholder}
          onPress={() => handleImagePressed(image)}
          onError={() => {
            if (!isImageLoadedObj[image.id]) setIsImageLoadedObj(i => ({...i, [image.id]: true}));
          }}
          onLoadEnd={() => {
            if (!isImageLoadedObj[image.id]) setIsImageLoadedObj(i => ({...i, [image.id]: true}));
          }}
        />
      </View>
    );
  };

  return (
    <View style={imageStyles.galleryImageContainer}>
      <FlatList
        keyExtractor={item => item.id.toString()}
        data={imageBasemaps}
        numColumns={3}
        renderItem={({item}) => renderImageBasemapThumbnail(item)}
        ListEmptyComponent={<ListEmptyText text={'No Image Basemaps in Active Datasets'}/>}
      />
    </View>
  );
};

export default ImageBasemapsList;
