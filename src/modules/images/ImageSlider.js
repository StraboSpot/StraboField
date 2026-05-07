import React, {useMemo, useState} from 'react';
import {ActivityIndicator, Platform, View} from 'react-native';

import {Image} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {imageSliderStyles, imageStyles, useImages} from '.';
import {getResizedImageURI, getLocalImageURI} from './imageURIs.helpers';
import ImageZoomAndPanWrapper from './ImageZoomAndPanWrapper';
import placeholderImage from '../../assets/images/noimage.jpg';
import {isEmpty} from '../../shared/helpers';
import {MEDIUMGREY} from '../../shared/styles.constants';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import IconButton from '../../shared/ui/buttons/IconButton';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedSpot} from '../spots/spots.slice';

const ImageSlider = ({route, navigation}) => {
  console.log('Rendering ImageSlider...');

  /* Data Hooks */
  const dispatch = useDispatch();
  const spots = useSelector(state => state.spot.spots);

  const {doesImageExistOnDevice} = useImages();
  const {width, height} = useWindowSize();

  /* Local State */

  const [imageIndex, setImageIndex] = useState(undefined);
  const [imageURI, setImageURI] = useState(undefined);
  const [isImageLoading, setIsImageLoading] = useState(true);

  /* Derived State */

  const imagesObj = useMemo(() => {
    const sortedSpotsWithImages = route.params.sortedSpotsWithImages;
    return sortedSpotsWithImages.reduce((acc, spot) => {
      const imagesInSpot = spot.properties.images?.reduce((acc1, image) => {
        return [...acc1, {imageId: image.id, spotId: spot.properties.id}];
      }, []);
      return [...acc, ...imagesInSpot];
    }, []);
  }, [route.params.sortedSpotsWithImages]);

  /* Event Handlers */

  const onPressNext = () => updateImage(imageIndex === imagesObj.length - 1 ? 0 : imageIndex + 1);

  const onPressPrevious = () => updateImage(imageIndex === 0 ? imagesObj.length - 1 : imageIndex - 1);

  /* Logic Helpers */

  const getSpotFromId = () => {
    console.log('getSpotFromId getCurrentIndex', imageIndex);
    const spot = spots[imagesObj[imageIndex].spotId];
    navigation.navigate('HomeScreen', {pageKey: PAGE_KEYS.OVERVIEW});
    dispatch(setSelectedSpot(spot));
  };

  const setSource = async (imageId) => {
    try {
      if (Platform.OS === 'web') setImageURI(getResizedImageURI(imageId, width, height));
      else {
        const res = await doesImageExistOnDevice(imageId);
        if (res) setImageURI(getLocalImageURI(imageId));
        else {
          setImageURI(undefined);
          setIsImageLoading(false);
        }
      }
    }
    catch (e) {
      setImageURI(undefined);
      setIsImageLoading(false);
    }
  };

  const updateImage = (i) => {
    setIsImageLoading(true);
    setImageIndex(i);
    const imageId = imagesObj[i].imageId;
    setSource(imageId);
  };

  /* View */

  if (isEmpty(imageIndex)) {
    const startImageId = route.params.selectedImage.id;
    const startIndex = imagesObj.map(i => i.imageId).indexOf(startImageId);
    setImageIndex(startIndex);
    setSource(startImageId);
    return null;
  }

  return (
    <View>
      <View style={imageSliderStyles.buttonsContainer}>
        <IconButton
          onPress={getSpotFromId}
          source={require('../../assets/icons/NotebookNavButton.png')}
          style={imageStyles.imageModalButtons}
        />
        <IconButton
          onPress={() => navigation.goBack()}
          source={require('../../assets/icons/Close.png')}
          style={imageStyles.imageModalButtons}
        />
      </View>
      <ImageZoomAndPanWrapper>
        <Image
          PlaceholderContent={isImageLoading ? <ActivityIndicator/>
            : <Image source={placeholderImage} style={imageStyles.thumbnail}/>}
          containerStyle={[imageStyles.thumbnailImageContainer, Platform.OS === 'web' ? {width: width, height: height}
            : {width: '100%', height: '100%'}]}
          onError={() => {
            if (imageURI) setIsImageLoading(false);
          }}
          onLoadEnd={() => {
            if (imageURI) setIsImageLoading(false);
          }}
          placeholderStyle={imageStyles.placeholderImage}
          resizeMode={'contain'}
          source={imageURI && {uri: imageURI}}
        />
      </ImageZoomAndPanWrapper>
      <View style={imageSliderStyles.navButtonsContainer}>
        <ClearButton
          icon={{
            containerStyle: {borderRadius: 50, borderWidth: 1, backgroundColor: MEDIUMGREY},
            name: 'chevron-back',
            size: 40,
            type: 'ionicon',
          }}
          onPress={onPressPrevious}
        />
        <ClearButton
          icon={{
            containerStyle: {borderRadius: 50, borderWidth: 1, backgroundColor: MEDIUMGREY},
            name: 'chevron-forward',
            size: 40,
            type: 'ionicon',
          }}
          onPress={onPressNext}
        />
      </View>
    </View>
  );
};

export default ImageSlider;
