import React, {useMemo, useState} from 'react';
import {ActivityIndicator, Platform, View} from 'react-native';

import {Button, Icon, Image} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {imageSliderStyles, imageStyles, useImages} from '.';
import placeholderImage from '../../assets/images/noimage.jpg';
import {isEmpty} from '../../shared/Helpers';
import IconButton from '../../shared/ui/buttons/IconButton';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import {PAGE_KEYS} from '../page/page.constants';
import {setSelectedSpot} from '../spots/spots.slice';

const ImageSlider = ({route, navigation}) => {
  console.log('Rendering ImageSlider...');
  const {width, height} = useWindowSize();
  const dispatch = useDispatch();
  const spots = useSelector(state => state.spot.spots);

  const {doesImageExistOnDevice, getImageScreenSizedURI, getLocalImageURI} = useImages();

  const [imageIndex, setImageIndex] = useState(undefined);
  const [imageURI, setImageURI] = useState(undefined);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const imagesObj = useMemo(() => {
    const sortedSpotsWithImages = route.params.sortedSpotsWithImages;
    return sortedSpotsWithImages.reduce((acc, spot) => {
      const imagesInSpot = spot.properties.images?.reduce((acc1, image) => {
        return [...acc1, {imageId: image.id, spotId: spot.properties.id}];
      }, []);
      return [...acc, ...imagesInSpot];
    }, []);
  }, [route.params.sortedSpotsWithImages]);

  const getSpotFromId = () => {
    console.log('getSpotFromId getCurrentIndex', imageIndex);
    const spot = spots[imagesObj[imageIndex].spotId];
    navigation.navigate('HomeScreen', {pageKey: PAGE_KEYS.OVERVIEW});
    dispatch(setSelectedSpot(spot));
  };

  const onPressNext = () => {
    updateImage(imageIndex === imagesObj.length - 1 ? 0 : imageIndex + 1);
  };

  const onPressPrevious = () => {
    updateImage(imageIndex === 0 ? imagesObj.length - 1 : imageIndex - 1);
  };

  const setSource = async (imageId) => {
    try {
      if (Platform.OS === 'web') setImageURI(getImageScreenSizedURI(imageId));
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

  if (isEmpty(imageIndex)) {
    const startImageId = route.params.selectedImage.id;
    const startIndex = imagesObj.map(i => i.imageId).indexOf(startImageId);
    setImageIndex(startIndex);
    setSource(startImageId);
  }
  else {
    return (
      <View>
        <View style={imageSliderStyles.buttonsContainer}>
          <IconButton
            onPress={getSpotFromId}
            source={require('../../assets/icons/NotebookNavButton.png')}
            style={imageStyles.imageInfoButtons}
          />
          <IconButton
            onPress={() => navigation.goBack()}
            source={require('../../assets/icons/Close.png')}
            style={imageStyles.imageInfoButtons}
          />
        </View>
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
        <View style={imageSliderStyles.navButtonsContainer}>
          <Button
            containerStyle={{borderRadius: 50, borderWidth: 1, backgroundColor: '#cccaca'}}
            icon={
              <Icon
                name={'chevron-back'}
                size={36}
                type={'ionicon'}
              />
            }
            onPress={onPressPrevious}
            type={'clear'}
          />
          <Button
            containerStyle={{borderRadius: 50, borderWidth: 1, backgroundColor: '#cccaca'}}
            icon={
              <Icon
                name={'chevron-forward'}
                size={36}
                type={'ionicon'}
              />
            }
            onPress={onPressNext}
            type={'clear'}
          />
        </View>
      </View>
    );
  }
};

export default ImageSlider;
