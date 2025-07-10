import React from 'react';
import {FlatList, View} from 'react-native';

import ListEmptyText from '../../shared/ui/ListEmptyText';
import {imageStyles, ImageThumbnail, useImages} from '../images';
import {useSpots} from '../spots';

const ImageBasemapsList = ({closeManMenuPanel}) => {
  console.log('Rendering ImageBasemaps...');

  const {getActiveImageBasemaps} = useSpots();
  const {getImageBasemap} = useImages();

  const imageBasemaps = getActiveImageBasemaps();

  const handleImagePressed = (image) => {
    closeManMenuPanel();
    getImageBasemap(image);
  };

  const renderItem = ({item}) => {
    return (
      <ImageThumbnail
        handleImagePressed={() => handleImagePressed(item)}
        imageId={item.id}
      />
    );
  };

  return (
    <View style={imageStyles.galleryImageContainer}>
      <FlatList
        keyExtractor={item => item.id.toString()}
        data={imageBasemaps}
        numColumns={3}
        renderItem={renderItem}
        ListEmptyComponent={<ListEmptyText text={'No Image Basemaps in Active Datasets'}/>}
      />
    </View>
  );
};

export default ImageBasemapsList;
