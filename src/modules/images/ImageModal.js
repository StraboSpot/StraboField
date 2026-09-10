import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Platform, Text, View} from 'react-native';

import {Icon, Image} from '@rn-vui/base';

import {ImagePropertiesModal, imageStyles} from '.';
import {getLocalImageURI, getResizedImageURI} from './imageURIs.helpers';
import ImageZoomAndPanWrapper from './ImageZoomAndPanWrapper';
import placeholderImage from '../../assets/images/noimage.jpg';
import commonStyles from '../../shared/common.styles';
import {
  BLACK,
  PRIMARY_ACCENT_COLOR,
  SECONDARY_BACKGROUND_COLOR,
  SMALL_SCREEN,
  SMALL_SCREEN_STATUS_BAR_OFFSET,
  WARNING_COLOR,
  WHITE,
} from '../../shared/styles.constants';
import IconButton from '../../shared/ui/buttons/IconButton';
import Loading from '../../shared/ui/Loading';
import DeleteConformationDialogBox from '../../shared/ui/modals/DeleteConformationDialogBox';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {useWindowSize} from '../../shared/ui/useWindowSize';

const ImageModal = ({
                      deleteImage,
                      image,
                      isReadOnly,
                      isVisible,
                      onOpenSketch,
                      saveUpdatedImage,
                      setImageToView,
                      setIsImageModalVisible,
                      shouldOpenProperties,
                    }) => {
  console.log('Rendering ImageModal...');

  /* Data Hooks */

  const {width, height} = useWindowSize();

  /* Local State */

  const [isImageDeleteModalVisible, setIsImageDeleteModalVisible] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImagePropertiesModalVisible, setIsImagePropertiesModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* Side Effects */

  // Auto-open the nested properties modal when the viewer is opened straight to properties from an
  // image card (large screens only — small screens open the properties modal without the viewer).
  // Nesting is required so it stacks reliably over the viewer's modal on iOS rather than as a sibling.
  // Closing the viewer while properties is still open closes properties too, so it doesn't linger open
  // (visually hidden with the viewer) and reappear the next time the viewer is opened.
  useEffect(() => {
    if (isVisible && shouldOpenProperties) setIsImagePropertiesModalVisible(true);
    else if (!isVisible) setIsImagePropertiesModalVisible(false);
  }, [isVisible, shouldOpenProperties]);

  /* Event Handlers */

  const handleDeleteImageOnPress = () => {
    setIsImageDeleteModalVisible(true);
  };

  const onDeleteImage = async () => {
    setIsLoading(true);
    setIsImageDeleteModalVisible(false);
    try {
      const isImageDeleted = await deleteImage(image);
      if (isImageDeleted) setIsImageModalVisible(false);
    }
    finally {
      setIsLoading(false);
    }
  };

  /* Render Functions */

  const renderDeleteImageModal = () => {
    return (
      <DeleteConformationDialogBox
        doesRenderAsView
        headerTitle={'Delete Image'}
        isVisible={isImageDeleteModalVisible}
        onActionPressed={onDeleteImage}
        onCancelPress={() => setIsImageDeleteModalVisible(false)}
        overlayStyleOverride={{maxHeight: '25%'}}
      >
        <Text>Are you sure you want to delete</Text>
        <Text>{image.title || image.id}?</Text>
      </DeleteConformationDialogBox>
    );
  };


  /* View */

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
      <View style={{backgroundColor: SECONDARY_BACKGROUND_COLOR}}>
        <ImageZoomAndPanWrapper>
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
            source={Platform.OS === 'web' ? {uri: getResizedImageURI(image.id, width, height)}
              : {uri: getLocalImageURI(image.id, image.modified_timestamp)}}
            style={Platform.OS === 'web' ? {width: width - 100, height: height - 100}
              : {width: width, height: height - 100 - (SMALL_SCREEN ? SMALL_SCREEN_STATUS_BAR_OFFSET : 0)}}
          />
        </ImageZoomAndPanWrapper>
        <View style={imageStyles.rightsideIcons}>
          <Icon
            color={isImagePropertiesModalVisible ? WHITE : BLACK}
            containerStyle={[
              imageStyles.imageModalIconBox,
              isImagePropertiesModalVisible && {backgroundColor: PRIMARY_ACCENT_COLOR},
            ]}
            name={'information-circle-outline'}
            onPress={() => setIsImagePropertiesModalVisible(true)}
            size={32}
            type={'ionicon'}
          />
          {Platform.OS !== 'web' && !isReadOnly && (
            <IconButton
              onPress={() => onOpenSketch(image)}
              source={require('../../assets/icons/ImageSketchButton.png')}
              style={imageStyles.imageModalButtons}
            />
          )}
          {!isReadOnly && (
            <Icon
              color={WARNING_COLOR}
              containerStyle={imageStyles.imageModalIconBox}
              name={'trash-outline'}
              onPress={() => handleDeleteImageOnPress()}
              size={32}
              type={'ionicon'}
            />
          )}
        </View>
      </View>

      {/* Modal*/}
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
      <Loading isLoading={isLoading}/>
    </ModalWrapper>
  );
};

export default ImageModal;
