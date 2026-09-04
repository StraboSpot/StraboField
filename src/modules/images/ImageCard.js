import React, {useEffect, useState} from 'react';
import {Platform, Text, TextInput, TouchableOpacity, View} from 'react-native';

import {Card, Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {imageStyles, ImageThumbnail, useImageThumbnails, useImages} from '.';
import useDevice from '../../services/device/useDevice';
import {isEmpty} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR, SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {MODAL_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {useSpots} from '../spots';
import {editedSpotImage} from '../spots/spots.slice';

const ImageCard = ({
                     areImageThumbnailsLoading,
                     image,
                     imageThumbnailURIs,
                     index,
                     isReadOnlyImage,
                     isThumbnailOnly,
                     onOpenImage,
                     onOpenImageProperties,
                     saveUpdatedImage,
                     setAreImageThumbnailsLoading,
                     setImageThumbnailURIs,
                     spotWithImage,
                   }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const modalVisible = useSelector(state => state.home.modalVisible);
  const spot = useSelector(state => state.spot.selectedSpot);
  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);
  const {isInternetReachable, isConnected} = useSelector(state => state.connections.isOnline);

  const {downloadImageAndSave} = useDevice();
  const {deleteImageFromSpot, getImageBasemap, setAnnotation} = useImages();
  const {getImageThumbnailURIs} = useImageThumbnails();
  const {getAllSpotsOnImageBasemap} = useSpots();

  /* Local State */

  const [isEditing, setIsEditing] = useState(false);
  const [isImageMissingOnServer, setIsImageMissingOnServer] = useState(false);
  const [isMissingImageModalVisible, setIsMissingImageModalVisible] = useState(false);
  const [title, setTitle] = useState(getDisplayTitle);

  /* Derived Variables */

  const placeholderTitle = `Untitled ${index + 1}`;

  /* Side Effects */

  useEffect(() => {
    setTitle(getDisplayTitle());
  }, [image.title, placeholderTitle]);

  /* Event Handlers */

  const handleEditImageName = (value) => {
    if (value && value !== '') setTitle(value);
    else setTitle(undefined);
  };

  const handleEndEditing = () => {
    if (!isEmpty(title) && title !== image.title) {
      const updatedImage = {...image, title};
      if (modalVisible === MODAL_KEYS.NOTEBOOK.SAMPLES || modalVisible === MODAL_KEYS.SHORTCUTS.SAMPLE) {
        saveUpdatedImage(updatedImage);
      }
      else {
        dispatch(editedSpotImage(updatedImage));
        dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      }
    }
    if (isEmpty(title)) setTitle(undefined);
    setIsEditing(false);
  };

  const handleImageFinishedLoading = () => {
    if (imageThumbnailURIs?.[image.id]) setAreImageThumbnailsLoading(i => ({...i, [image.id]: false}));
  };

  const handleImagePressed = async () => {
    if (imageThumbnailURIs?.[image.id]) {
      if (onOpenImage) onOpenImage(image);
    }
    else {
      setAreImageThumbnailsLoading({...areImageThumbnailsLoading, [image.id]: true});
      const res = await downloadImageAndSave(image.id);
      if (res) {
        console.log('Got Image');
        const uriObj = await getImageThumbnailURIs([image]);
        setImageThumbnailURIs({...imageThumbnailURIs, ...uriObj});
        if (isImageMissingOnServer) setIsImageMissingOnServer(false);
      }
      else {
        console.log('Image not found on device');
        handleMissingImage();
      }
      setAreImageThumbnailsLoading({...areImageThumbnailsLoading, [image.id]: false});
    }
  };

  const handleMissingImage = () => {
    setIsImageMissingOnServer(true);
    if (!isReadOnlyImage && !isReadOnlyProject) setIsMissingImageModalVisible(true);
  };

  const handleStartEditing = () => {
    if (isEmpty(image.title) || title?.toLowerCase().startsWith('untitled')) setTitle('');
    setIsEditing(true);
  };

  /* Logic Helpers */

  const deleteImage = async () => {
    console.log('Deleting image from spot', image.id);
    await deleteImageFromSpot(image.id, spotWithImage || spot);
    console.log('Deleted image from spot', image.id);
    setIsMissingImageModalVisible(false);
  };

  function getDisplayTitle() {
    return image.title && typeof image.title === 'string' && image.title.trim() !== '' ? image.title.toString()
      : placeholderTitle;
  }

  const getIsSwitchDisabled = () => !isEmpty(getAllSpotsOnImageBasemap(image.id)) || isReadOnlyImage;

  /* View */

  return (
    <>
      <Card containerStyle={imageStyles.cardContainer}>
        <View style={imageStyles.cardTitleContainer}>
          {isEditing ? (
            <TextInput
              autoFocus
              blurOnSubmit                        // Needed for web
              onChangeText={handleEditImageName}
              onEndEditing={handleEndEditing}
              onSubmitEditing={handleEndEditing}  // Needed for web
              placeholder={placeholderTitle}
              style={[imageStyles.cardTitle, Platform.OS === 'web' && {
                display: 'inline-block',
                maxWidth: 85,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }]}
              value={title}
            />
          ) : (
            <TouchableOpacity
              disabled={isReadOnlyImage}
              onPress={handleStartEditing}
              style={imageStyles.cardTitleEditingButton}>
              <Text
                ellipsizeMode={Platform.OS !== 'web' ? 'tail' : undefined}
                numberOfLines={Platform.OS !== 'web' ? 1 : undefined}
                style={[
                  imageStyles.cardTitle,
                  Platform.OS === 'web' && {
                    display: 'inline-block',
                    maxWidth: 85,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                ]}
              >
                {title || placeholderTitle}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={imageStyles.cardImageContainer}>
          <ImageThumbnail
            imageThumbnailURI={imageThumbnailURIs?.[image.id]}
            isConnected={isConnected}
            isImageMissingOnServer={isImageMissingOnServer}
            isImageThumbnailLoading={areImageThumbnailsLoading?.[image.id]}
            isInternetReachable={isInternetReachable}
            isThumbnailOnly={isThumbnailOnly}
            onFinishedLoading={handleImageFinishedLoading}
            onImagePressed={handleImagePressed}
          />
        </View>

        {!isThumbnailOnly && (
          <>
            {/* Image icon overlays */}
            <View style={imageStyles.cardOverlayIconsContainer}>
              {/* Image Properties icon overlay */}
              <TouchableOpacity
                onPress={() => onOpenImageProperties?.(image)}
                style={[imageStyles.cardOverlayIcon, {left: 8}]}
              >
                <Icon color={PRIMARY_ACCENT_COLOR} name={'information-circle-outline'} size={24} type={'ionicon'}/>
              </TouchableOpacity>

              {/* Image Basemap icon overlay */}
              {image.annotated && (
                <TouchableOpacity
                  onPress={() => getImageBasemap(image)}
                  style={[imageStyles.cardOverlayIcon, {right: 8}]}
                >
                  <Icon color={PRIMARY_ACCENT_COLOR} name={'map-outline'} size={24} type={'ionicon'}/>
                </TouchableOpacity>
              )}
            </View>

            {/* Image Basemap toggle */}
            <View style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}>
              <SwitchWrapper
                disabled={getIsSwitchDisabled()}
                onValueChange={isAnnotated => setAnnotation(image, isAnnotated, title ? title : placeholderTitle)}
                value={image.annotated}
              />
              <Text style={{flexShrink: 1, fontSize: SMALL_TEXT_SIZE, textAlign: 'left'}}>
                Use Image as{'\n'}a Basemap?
              </Text>
            </View>
          </>
        )}
      </Card>

      {/* Modals */}
      <ModalWrapper
        actionTitle={'Delete'}
        headerTitle={'Missing Image on Server!'}
        isVisible={isMissingImageModalVisible}
        onActionPressed={deleteImage}
        onCancelPress={() => setIsMissingImageModalVisible(false)}
        overlayStyleOverride={{height: 'auto'}}
        showActionButton={true}
        showCancelButton
        showDeleteButton={false}
      >
        <View style={{padding: 10}}>
          <Text style={{textAlign: 'center', paddingVertical: 10}}>
            The image {image.id} is missing from the server. Would you like to remove the image?
          </Text>
        </View>
      </ModalWrapper>
    </>
  );
};

export default ImageCard;
