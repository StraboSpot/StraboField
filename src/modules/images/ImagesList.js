import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';

import {ImageCard, ImageInfo, imageStyles, useImageThumbnails} from '.';
import commonStyles from '../../shared/common.styles';
import ListEmptyText from '../../shared/ui/ListEmptyText';

const ImagesList = ({
                      deleteImage,
                      images,
                      isReadOnly,
                      isThumbnailOnly = false,
                      openImage,
                      saveImages,
                      saveUpdatedImage,
                    }) => {
  const [imageToView, setImageToView] = useState({});
  const [isError, setIsError] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  const {
    areImageThumbnailsLoading,
    imageThumbnailURIs,
    setAreImageThumbnailsLoading,
    setImageThumbnailURIs,
  } = useImageThumbnails({images});

  // const onFocusEffect = useCallback(() => {
  //   if (Platform.OS === 'ios') {
  //     KeyboardManager.setEnable(true);
  //   }
  //   return () => {
  //     if (Platform.OS === 'ios') {
  //       console.log('BasicPageDetail onFocusEffect');
  //       KeyboardManager.setEnable(false);
  //     }
  //   };
  // }, []);
  //
  // useFocusEffect(onFocusEffect);

  const renderError = () => (
    <View style={{paddingTop: 75}}>
      <Icon name={'alert-circle-outline'} size={100} type={'ionicon'}/>
      <Text style={[commonStyles.noValueText, {paddingTop: 50}]}>Problem getting thumbnail images...</Text>
    </View>
  );

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
          openImage={openImage}
          setAreImageThumbnailsLoading={setAreImageThumbnailsLoading}
          setImageThumbnailURIs={setImageThumbnailURIs}
          setImageToView={setImageToView}
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

  return (
    <>
      <View style={{flex: 1}}>
        {isError ? renderError() : renderImages()}
      </View>
      <ImageInfo
        deleteImage={deleteImage}
        image={imageToView}
        isReadOnly={isReadOnly}
        isVisible={isImageModalVisible}
        saveImages={saveImages}
        saveUpdatedImage={saveUpdatedImage}
        setImageToView={setImageToView}
        setIsImageModalVisible={setIsImageModalVisible}
      />
    </>
  );
};

export default ImagesList;
