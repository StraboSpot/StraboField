import React, {useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {Button, Card, Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {imageStyles, ImageThumbnail, useImages} from '.';
import useDevice from '../../services/useDevice';
import {isEmpty, truncateText} from '../../shared/Helpers';
import {MEDIUMGREY, PRIMARY_ACCENT_COLOR, SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {useSpots} from '../spots';
import {editedSpotImage} from '../spots/spots.slice';

const ImageCard = ({
                     areImageThumbnailsLoading,
                     image,
                     imageThumbnailURIs,
                     index,
                     isThumbnailOnly,
                     openImage,
                     setAreImageThumbnailsLoading,
                     setImageThumbnailURIs,
                     setImageToView,
                     setIsImageModalVisible,
                   }) => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const [title, setTitle] = useState(
    image.title && typeof image.title === 'string' && image.title.trim !== '' ? image.title.toString() : undefined);

  const {downloadImageAndSave} = useDevice();
  const {getImageBasemap, getImageThumbnailURIs, setAnnotation} = useImages();
  const {getSpotsMappedOnGivenImageBasemap} = useSpots();

  const placeholderTitle = 'Untitled ' + (index + 1);

  const getIsSwtichDisabled = () => !isEmpty(getSpotsMappedOnGivenImageBasemap(image.id));

  const handleEditImageName = async (value) => {
    if (value && value !== '') setTitle(value);
    else setTitle(undefined);
  };

  const handleEndEditing = () => {
    if (isEmpty(title) || title !== image.title) {
      const updatedImage = {...image, title: isEmpty(title) ? placeholderTitle : title};
      dispatch(editedSpotImage(updatedImage));
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    }
  };

  const handleImagePressed = async () => {
    if (imageThumbnailURIs?.[image.id]) {
      if (openImage) openImage(image);
      else {
        setImageToView(image);
        setIsImageModalVisible(true);
      }
    }
    else {
      setAreImageThumbnailsLoading({...areImageThumbnailsLoading, [image.id]: true});
      const res = await downloadImageAndSave(image.id);
      if (res) {
        console.log('Got Image');
        const uriObj = await getImageThumbnailURIs([image]);
        setImageThumbnailURIs({...imageThumbnailURIs, ...uriObj});
      }
      setAreImageThumbnailsLoading({...areImageThumbnailsLoading, [image.id]: false});
    }
  };

  const handleImageFinishedLoading = () => {
    if (imageThumbnailURIs?.[image.id]) setAreImageThumbnailsLoading(i => ({...i, [image.id]: false}));
  };

  return (
    <Card containerStyle={imageStyles.cardContainer}>
      <TextInput
        blurOnSubmit={true}                  // Needed for web
        onChangeText={handleEditImageName}
        onEndEditing={handleEndEditing}
        onSubmitEditing={handleEndEditing}   // Needed for web
        placeholder={placeholderTitle}
        style={imageStyles.cardTitle}
        value={truncateText(title, isThumbnailOnly ? 8 : 16)}
      />

      <View style={imageStyles.cardImageContainer}>
        <ImageThumbnail
          imageThumbnailURI={imageThumbnailURIs?.[image.id]}
          isImageThumbnailLoading={areImageThumbnailsLoading?.[image.id]}
          isThumbnailOnly={isThumbnailOnly}
          onFinishedLoading={handleImageFinishedLoading}
          onImagePressed={handleImagePressed}
        />
      </View>

      {!isThumbnailOnly && (
        <View style={{flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 5}}>
          <SwitchWrapper
            disabled={getIsSwtichDisabled()}
            onValueChange={isAnnotated => setAnnotation(image, isAnnotated, title ? title : placeholderTitle)}
            value={image.annotated}
          />
          <Text style={{fontSize: SMALL_TEXT_SIZE, textAlign: 'center', paddingHorizontal: 5}}>
            Use Image as{'\n'}a Basemap?
          </Text>
          <Button
            disabled={!image.annotated}
            icon={
              <Icon
                type={'ionicon'}
                size={20}
                name={'map-outline'}
                color={image.annotated ? PRIMARY_ACCENT_COLOR : MEDIUMGREY}
              />
            }
            onPress={() => getImageBasemap(image)}
            type={'clear'}
          />
        </View>
      )}
    </Card>
  );
};

export default ImageCard;
