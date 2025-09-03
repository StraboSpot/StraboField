import React, {useState} from 'react';
import {ActivityIndicator, Platform, Text, View} from 'react-native';

import {Image} from '@rn-vui/base';

import {ImagePropertiesModal, imageStyles, useImages} from '.';
import placeholderImage from '../../assets/images/noimage.jpg';
import commonStyles from '../../shared/common.styles';
import IconButton from '../../shared/ui/IconButton';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import {WarningModal} from '../home/modals';
import overlayStyles from '../home/overlays/overlay.styles';
import SketchModal from '../sketch/SketchModal';

const ImageInfo = ({deleteImage, image, saveImages, saveUpdatedImage, setImageToView, setIsImageModalVisible}) => {
  console.log('Rendering ImageInfo...');

  const {width, height} = useWindowSize();

  const [isImageDeleteModalVisible, setIsImageDeleteModalVisible] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImagePropertiesModalVisible, setIsImagePropertiesModalVisible] = useState(false);
  const [isSketchModalVisible, setIsSketchModalVisible] = useState(false);

  const {getImageScreenSizedURI, getLocalImageURI} = useImages();

  const handleDeleteImageOnPress = () => {
    setIsImageDeleteModalVisible(true);
  };

  const onDeleteImage = async () => {
    setIsImageDeleteModalVisible(false);
    const isImageDeleted = await deleteImage(image);
    if (isImageDeleted) setIsImageModalVisible(false);
  };

  const openInSketch = () => {
    setIsSketchModalVisible(true);
  };

  const renderDeleteImageModal = () => {
    return (
      <WarningModal
        closeModal={() => setIsImageDeleteModalVisible(false)}
        confirmText={'Delete'}
        confirmTitleStyle={overlayStyles.importantText}
        isVisible={isImageDeleteModalVisible}
        onConfirmPress={onDeleteImage}
        showCancelButton
        showConfirmButton
        title={'Delete Image?'}
      >
        <Text>Are you sure you want to delete image:{'\n'}</Text>
        <Text>{image.title || image.id}</Text>
      </WarningModal>
    );
  };

  return (
    <>
      <View style={{backgroundColor: 'black', justifyContent: 'center', alignContent: 'center'}}>
        <Image
          PlaceholderContent={!isImageLoaded ? <ActivityIndicator/>
            : <Image source={placeholderImage} style={imageStyles.thumbnail}/>}
          onError={() => {
            if (!isImageLoaded) setIsImageLoaded(true);
          }}
          onLoadEnd={() => {
            if (!isImageLoaded) setIsImageLoaded(true);
          }}
          placeholderStyle={commonStyles.imagePlaceholder}
          resizeMode={'contain'}
          source={Platform.OS === 'web' ? {uri: getImageScreenSizedURI(image.id)}
            : {uri: getLocalImageURI(image.id)}}
          style={Platform.OS === 'web' ? {width: width, height: height}
            : {width: '100%', height: '100%'}}
        />
        <View style={imageStyles.closeButtonContainer}>
          <IconButton
            onPress={() => setIsImageModalVisible(false)}
            source={require('../../assets/icons/Close.png')}
            style={imageStyles.closeButtonStyle}
          />
        </View>
        <View style={imageStyles.rightsideIcons}>
          <IconButton
            onPress={() => setIsImagePropertiesModalVisible(true)}
            source={require('../../assets/icons/ImagePropertiesButton.png')}
            style={imageStyles.imageInfoButtons}
          />
          {Platform.OS !== 'web' && (
            <IconButton
              onPress={openInSketch}
              source={require('../../assets/icons/ImageSketchButton.png')}
              style={imageStyles.imageInfoButtons}
            />
          )}
          <IconButton
            onPress={() => handleDeleteImageOnPress()}
            source={require('../../assets/icons/DeleteButton.png')}
            style={imageStyles.imageInfoButtons}
          />
        </View>
      </View>
      {isImagePropertiesModalVisible && (
        <ImagePropertiesModal
          closeModal={() => setIsImagePropertiesModalVisible(false)}
          image={image}
          saveUpdatedImage={saveUpdatedImage}
          setImageToView={setImageToView}
        />
      )}
      {renderDeleteImageModal()}
      {isSketchModalVisible && (
        <SketchModal image={image} saveImages={saveImages} setIsSketchModalVisible={setIsSketchModalVisible}/>
      )}
    </>
  );
};

export default ImageInfo;
