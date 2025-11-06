import React, {useState} from 'react';
import {ActivityIndicator, Platform, Text, View} from 'react-native';

import {Image} from '@rn-vui/base';

import {ImagePropertiesModal, imageStyles, useImages} from '.';
import placeholderImage from '../../assets/images/noimage.jpg';
import commonStyles from '../../shared/common.styles';
import {SECONDARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import IconButton from '../../shared/ui/buttons/IconButton';
import Loading from '../../shared/ui/Loading';
import {WarningModal} from '../../shared/ui/modals';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import SketchModal from '../sketch/SketchModal';

const ImageInfo = ({
                     deleteImage,
                     image,
                     isReadOnly,
                     isVisible,
                     saveImages,
                     saveUpdatedImage,
                     setImageToView,
                     setIsImageModalVisible,
                   }) => {
  console.log('Rendering ImageInfo...');

  const {width, height} = useWindowSize();

  const [isImageDeleteModalVisible, setIsImageDeleteModalVisible] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImagePropertiesModalVisible, setIsImagePropertiesModalVisible] = useState(false);
  const [isSketchModalVisible, setIsSketchModalVisible] = useState(false);

  const {getImageScreenSizedURI, getLocalImageURI} = useImages();

  const handleDeleteImageOnPress = () => {
    setIsImageDeleteModalVisible(true);
  };

  const onDeleteImage = async () => {
    setIsLoading(true);
    setIsImageDeleteModalVisible(false);
    const isImageDeleted = await deleteImage(image);
    setIsLoading(false);
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
    <ModalWrapper
      closeModal={() => setIsImageModalVisible(false)}
      fullscreen
      headerTitle={image.title || 'Untitled'}
      isVisible={isVisible}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton
    >
      <View style={{
        flex: 1,
        backgroundColor: SECONDARY_BACKGROUND_COLOR,
        justifyContent: 'center',
        alignContent: 'center',
      }}>
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
          style={Platform.OS === 'web' ? {width: width - 100, height: height - 100}
            : {width: '100%', height: '100%'}}
        />
        <View style={imageStyles.rightsideIcons}>
          <IconButton
            onPress={() => setIsImagePropertiesModalVisible(true)}
            source={require('../../assets/icons/ImagePropertiesButton.png')}
            style={imageStyles.imageInfoButtons}
          />
          {Platform.OS !== 'web' && !isReadOnly && (
            <IconButton
              onPress={openInSketch}
              source={require('../../assets/icons/ImageSketchButton.png')}
              style={imageStyles.imageInfoButtons}
            />
          )}
          {!isReadOnly && (
            <IconButton
              onPress={() => handleDeleteImageOnPress()}
              source={require('../../assets/icons/DeleteButton.png')}
              style={imageStyles.imageInfoButtons}
            />
          )}
        </View>
      </View>
      {isImagePropertiesModalVisible && (
        <ImagePropertiesModal
          closeModal={() => setIsImagePropertiesModalVisible(false)}
          image={image}
          isReadOnly={isReadOnly}
          isVisible={isImagePropertiesModalVisible}
          saveUpdatedImage={saveUpdatedImage}
          setImageToView={setImageToView}
        />
      )}
      {renderDeleteImageModal()}
      {isSketchModalVisible && (
        <SketchModal image={image} saveImages={saveImages} setIsSketchModalVisible={setIsSketchModalVisible}/>
      )}
      <Loading isLoading={isLoading}/>
    </ModalWrapper>
  );
};

export default ImageInfo;
