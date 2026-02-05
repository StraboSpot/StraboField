import React, {useState} from 'react';
import {SectionList, Text, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';

import {ImagesList, imageStyles} from '.';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {setLoadingStatus} from '../home/home.slice';
import {PAGE_KEYS} from '../page/page.constants';
import useProject from '../project/useProject';
import {useSpots} from '../spots';
import SpotFilters from '../spots/SpotFilters';

const ImageGallery = ({openSpotInNotebook, updateSpotsInMapExtent}) => {
  console.log('Rendering ImageGallery...');

  const navigate = useNavigation();
  const {isSpotInReadOnlyDataset} = useProject();
  const {getActiveSpotsObj, getSpotsWithImages} = useSpots();

  const dispatch = useDispatch();

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);

  const [isReverseSort, setIsReverseSort] = useState(false);
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Active Datasets');

  let sortedSpotsWithImages = [];

  const openImage = async (image) => {
    dispatch(setLoadingStatus({view: 'home', bool: true}));
    console.log('Opening image', image.id, '...');
    navigate.navigate('ImageSlider', {selectedImage: image, sortedSpotsWithImages: sortedSpotsWithImages});
    dispatch(setLoadingStatus({view: 'home', bool: false}));
  };

  const renderImagesInSpot = (images, section) => {
    const isReadOnly = !isEmpty(section.spot) && isSpotInReadOnlyDataset(section.spot.properties.id);
    return <ImagesList images={images} isReadOnly={isReadOnly} isThumbnailOnly openImage={openImage}/>;
  };

  const renderNoImagesText = () => {
    return <ListEmptyText text={'No Images in Active Datasets'}/>;
  };

  const renderSectionHeader = ({spot}) => {
    return (
      <SectionDividerWithRightButton
        buttonTitle={spot.properties?.isSample ? 'View in Sample' : 'View In Spot'}
        dividerText={spot.properties.name}
        onPress={() => openSpotInNotebook(spot, PAGE_KEYS.IMAGES)}
      />
    );
  };

  const renderSpotsWithImages = () => {
    const spotsWithImages = JSON.parse(JSON.stringify(spotsSorted.filter(spot => !isEmpty(spot.properties.images))));
    sortedSpotsWithImages = spotsWithImages.map((spot) => {
      const sortedImages = JSON.parse(JSON.stringify(spot.properties.images))
        .sort((imgA, imgB) => (imgA?.title?.toString() || 'UntitledA')
          .localeCompare(imgB?.title?.toString() || 'UntitledB'));  // alphabetize by name
      return {...spot, properties: {...spot.properties, images: sortedImages}};
    });
    if (isReverseSort) sortedSpotsWithImages = sortedSpotsWithImages.reverse();
    let count = 0;
    const spotsAsSections = sortedSpotsWithImages.reduce((acc, spot) => {
      count += spot.properties.images.length;
      return [...acc, {spot: spot, data: [spot.properties.images]}];
    }, []);

    return (
      <>
        <SpotFilters
          activeSpots={activeSpots}
          setIsReverseSort={setIsReverseSort}
          setSpotsSorted={setSpotsSorted}
          setTextNoSpots={setTextNoSpots}
          updateSpotsInMapExtent={updateSpotsInMapExtent}
        />
        <View style={imageStyles.galleryImageContainer}>
          <LittleSpacer/>
          <Text style={[commonStyles.standardDescriptionText, {alignSelf: 'center'}]}>
            Found {count + (count === 1 ? ' Image' : ' Images')} in Active Spots and Samples
          </Text>
          <LittleSpacer/>
          <SectionList
            ListEmptyComponent={<ListEmptyText text={textNoSpots + ' with Images Found'}/>}
            keyExtractor={(item, index) => item + index}
            renderItem={({item, section}) => renderImagesInSpot(item, section)}
            renderSectionHeader={({section}) => renderSectionHeader(section)}
            sections={spotsAsSections}
            stickySectionHeadersEnabled={true}
          />
        </View>
      </>
    );
  };

  return isEmpty(getSpotsWithImages()) ? renderNoImagesText() : renderSpotsWithImages();
};

export default ImageGallery;
