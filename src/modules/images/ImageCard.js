import React, {useState} from 'react';
import {Platform, Text, TextInput, TouchableOpacity, View} from 'react-native';

import {Card} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {imageStyles, ImageThumbnail, useImages} from '.';
import useDevice from '../../services/useDevice';
import {isEmpty} from '../../shared/Helpers';
import {MEDIUMGREY, PRIMARY_ACCENT_COLOR, SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
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
                     setAreImageThumbnailsLoading,
                     setImageThumbnailURIs,
                     spotWithImage,
                   }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);
  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);
  const {isInternetReachable, isConnected} = useSelector(state => state.connections.isOnline);

  const {downloadImageAndSave} = useDevice();
  const {getImageBasemap, getImageThumbnailURIs, setAnnotation} = useImages();
  const {getSpotsMappedOnGivenImageBasemap} = useSpots();
  const {deleteImageFromSpot} = useImages();

  /* Local State */

  const [isEditing, setIsEditing] = useState(false);
  const [isImageMissingOnServer, setIsImageMissingOnServer] = useState(false);
  const [isMissingImageModalVisible, setIsMissingImageModalVisible] = useState(false);

  const placeholderTitle = `Untitled ${index + 1}`;

  const [title, setTitle] = useState(
    image.title && typeof image.title === 'string' && image.title.trim() !== ''
      ? image.title.toString()
      : placeholderTitle,
  );

  /* Event Handlers */

  const handleEditImageName = (value) => {
    if (value && value !== '') setTitle(value);
    else setTitle(undefined);
  };

  const handleEndEditing = () => {
    if (isEmpty(title) || title !== image.title) {
      const updatedImage = {...image, title: isEmpty(title) ? placeholderTitle : title};
      dispatch(editedSpotImage(updatedImage));
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    }
    setIsEditing(false);
  };

  const handleImageFinishedLoading = () => {
    if (imageThumbnailURIs?.[image.id]) setAreImageThumbnailsLoading(i => ({...i, [image.id]: false}));
  };

  const handleImagePressed = async () => {
    // debugger;
    if (imageThumbnailURIs?.[image.id]) {
      if (onOpenImage) onOpenImage(image);
    }
    else {
      setAreImageThumbnailsLoading({...areImageThumbnailsLoading, [image.id]: true});
      const res = await downloadImageAndSave(image.id);
      console.log('Got response from downloadImageAndSave', res);
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

  /* Logic Helpers */

  const getIsSwitchDisabled = () => !isEmpty(getSpotsMappedOnGivenImageBasemap(image.id)) || isReadOnlyImage;

  const deleteImage = async () => {
    console.log('Deleting image from spot', image.id);
    await deleteImageFromSpot(image.id, spotWithImage || spot);
    console.log('Deleted image from spot', image.id);
    setIsMissingImageModalVisible(false);
  };

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
                maxWidth: 87,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }]}
              value={title}
            />
          ) : (
            <TouchableOpacity
              disabled={isReadOnlyImage}
              onPress={() => setIsEditing(true)}
              style={imageStyles.cardTitleEditingButton}>
              <Text
                ellipsizeMode={Platform.OS !== 'web' ? 'tail' : undefined}
                numberOfLines={Platform.OS !== 'web' ? 1 : undefined}
                style={[
                  imageStyles.cardTitle,
                  Platform.OS === 'web' && {
                    display: 'inline-block',
                    maxWidth: 87,
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
          <View
            style={{flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 5, alignItems: 'center'}}>
            <SwitchWrapper
              disabled={getIsSwitchDisabled()}
              onValueChange={isAnnotated => setAnnotation(image, isAnnotated, title ? title : placeholderTitle)}
              value={image.annotated}
            />
            <Text style={{fontSize: SMALL_TEXT_SIZE, textAlign: 'center', paddingHorizontal: 5}}>
              Use Image as{'\n'}a Basemap?
            </Text>
            <View style={{margin: -5}}>
              <ClearButton
                disabled={!image.annotated}
                icon={{
                  color: image.annotated ? PRIMARY_ACCENT_COLOR : MEDIUMGREY,
                  name: 'map-outline',
                  size: 20,
                  type: 'ionicon',
                }}
                onPress={() => getImageBasemap(image)}
              />
            </View>
          </View>
        )}
      </Card>
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
        <View>
          <Text style={{textAlign: 'center', paddingVertical: 10}}>
            The image {image.id} is missing from the server. Would you like to remove the image?
          </Text>
        </View>
      </ModalWrapper>
    </>
  );
};

export default ImageCard;
