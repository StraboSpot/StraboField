import React, {useCallback, useState} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {useFocusEffect} from '@react-navigation/native';
import {Icon} from '@rn-vui/base';
import KeyboardManager from 'react-native-keyboard-manager';

import {ImageModal, imageStyles, ImageCard, useImageThumbnails} from '.';
import commonStyles from '../../shared/common.styles';
import ListEmptyText from '../../shared/ui/ListEmptyText';

const ImagesList = ({deleteImage, images, isThumbnailOnly = false, openImage, saveImages, saveUpdatedImage}) => {
  const [imageToView, setImageToView] = useState({});
  const [isError, setIsError] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  const {
    areImageThumbnailsLoading,
    imageThumbnailURIs,
    setAreImageThumbnailsLoading,
    setImageThumbnailURIs,
  } = useImageThumbnails({images});

  const onFocusEffect = useCallback(() => {
    if (Platform.OS === 'ios') {
      KeyboardManager.setEnable(true);
    }
    return () => {
      if (Platform.OS === 'ios') {
        console.log('BasicPageDetail onFocusEffect');
        KeyboardManager.setEnable(false);
      }
    };
  }, []);

  useFocusEffect(onFocusEffect);

  const renderError = () => (
    <View style={{paddingTop: 75}}>
      <Icon name={'alert-circle-outline'} type={'ionicon'} size={100}/>
      <Text style={[commonStyles.noValueText, {paddingTop: 50}]}>Problem getting thumbnail images...</Text>
    </View>
  );

  const renderImageCard = (image, index) => {
    return (
      <React.Fragment key={image.id}>
        <ImageCard
          image={image}
          imageThumbnailURIs={imageThumbnailURIs}
          index={index}
          areImageThumbnailsLoading={areImageThumbnailsLoading}
          isThumbnailOnly={isThumbnailOnly}
          openImage={openImage}
          setImageThumbnailURIs={setImageThumbnailURIs}
          setImageToView={setImageToView}
          setAreImageThumbnailsLoading={setAreImageThumbnailsLoading}
          setIsImageModalVisible={setIsImageModalVisible}
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
        data={sortedImages}
        ListEmptyComponent={<ListEmptyText text={'No Images'}/>}
        ListHeaderComponent={
          <View
            style={[imageStyles.imagesListContainer, {justifyContent: isThumbnailOnly ? 'flex-start' : 'space-evenly'}]}
          >
            {sortedImages.map((image, index) => renderImageCard(image, index))}
          </View>
        }
      />
    );
  };

  return (
    <>
      <View style={{flex: 1}}>
        {isError ? renderError() : renderImages()}
      </View>
      {isImageModalVisible && (
        <ImageModal
          deleteImage={deleteImage}
          image={imageToView}
          saveImages={saveImages}
          saveUpdatedImage={saveUpdatedImage}
          setImageToView={setImageToView}
          setIsImageModalVisible={setIsImageModalVisible}
        />
      )}
    </>
  );
};

export default ImagesList;
