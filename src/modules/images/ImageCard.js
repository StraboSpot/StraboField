import React, {useState} from 'react';
import {ActivityIndicator, Switch, Text, TextInput, View} from 'react-native';

import {Button, Card, Icon, Image} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {imageStyles, useImages} from './index';
import placeholderImage from '../../assets/images/noimage.jpg';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {MEDIUMGREY, PRIMARY_ACCENT_COLOR, SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotImage} from '../spots/spots.slice';

const ImageCard = ({
                     image,
                     imageThumbnails,
                     index,
                     isImageLoadedObj,
                     isOnReport,
                     setImageToView,
                     setIsImageLoadedObj,
                     setIsImageModalVisible,
                   }) => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const [title, setTitle] = useState(image.title && image.title !== '' ? image.title.toString() : undefined);

  const {getImageBasemap, setAnnotation} = useImages();

  const placeholderTitle = 'Untitled ' + (index + 1);

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

  const viewImage = (imageToView) => {
    setImageToView(imageToView);
    setIsImageModalVisible(true);
  };

  return (
    <Card containerStyle={imageStyles.cardContainer}>
      {!isOnReport && (
        <TextInput
          blurOnSubmit={true}                  // Needed for web
          onSubmitEditing={handleEndEditing}   // Needed for web
          onEndEditing={handleEndEditing}
          onChangeText={handleEditImageName}
          style={imageStyles.cardTitle}
          value={title}
          placeholder={placeholderTitle}
        />
      )}

      <Card.Image
        resizeMode={'cover'}
        containerStyle={imageStyles.cardImageContainer}
        source={imageThumbnails[image.id] ? {uri: imageThumbnails[image.id]} : placeholderImage}
        onPress={() => viewImage(image)}
        PlaceholderContent={isEmpty(isImageLoadedObj) || !isImageLoadedObj[image.id] ? <ActivityIndicator/>
          : <Image style={imageStyles.thumbnail} source={placeholderImage}/>}
        placeholderStyle={commonStyles.imagePlaceholder}
        onError={() => {
          if (!isImageLoadedObj[image.id]) setIsImageLoadedObj(i => ({...i, [image.id]: true}));
        }}
        onLoadEnd={() => {
          if (!isImageLoadedObj[image.id]) setIsImageLoadedObj(i => ({...i, [image.id]: true}));
        }}
      />

      {!isOnReport && (
        <View style={{flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 5}}>
          <Switch
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
