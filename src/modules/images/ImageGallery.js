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
import {PAGE_KEYS} from '../page/pageKeys.constants';
import useProject from '../project/useProject';
import {useSpots} from '../spots';
import SpotFilters from '../spots/SpotFilters';

let sortedSpotsWithImages = [];

const ImageGallery = ({openSpotInNotebook, updateSpotsInMapExtent}) => {
  console.log('Rendering ImageGallery...');

  /* Data Hooks */

  const dispatch = useDispatch();

  const navigate = useNavigation();
  const {isSpotInReadOnlyDataset} = useProject();
  const {getActiveSpotsObj, getSpotsWithImages} = useSpots();

  /* Local State */

  const [isReverseSort, setIsReverseSort] = useState(false);

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);

  const [spotsSearched, setSpotsSearched] = useState(activeSpots);
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Visible Datasets');

  /* Logic Helpers */

  const openImage = async (image) => {
    dispatch(setLoadingStatus({view: 'home', bool: true}));
    console.log('Opening image', image.id, '...');
    navigate.navigate('ImageSlider', {selectedImage: image, sortedSpotsWithImages: sortedSpotsWithImages});
    dispatch(setLoadingStatus({view: 'home', bool: false}));
  };

  /* Render Functions */

  const renderImagesInSpot = (images, section) => {
    const isReadOnly = !isEmpty(section.spot) && isSpotInReadOnlyDataset(section.spot.properties.id);
    return <ImagesList images={images} isReadOnly={isReadOnly} isThumbnailOnly openImage={openImage}/>;
  };

  const renderNoImagesText = () => {
    return <ListEmptyText text={'No Images in Visible Datasets'}/>;
  };

  const renderSectionHeader = ({spot}) => {
    return (
      <SectionDividerWithRightButton
        buttonTitle={'View In Spot'}
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
          setSpotsSearched={setSpotsSearched}
          setSpotsSorted={setSpotsSorted}
          setTextNoSpots={setTextNoSpots}
          spotsSearched={spotsSearched}
          updateSpotsInMapExtent={updateSpotsInMapExtent}
        />
        <View style={imageStyles.galleryImageContainer}>
          <LittleSpacer/>
          <Text style={[commonStyles.standardDescriptionText, {alignSelf: 'center'}]}>
            Found {count + (count === 1 ? ' image' : ' images')} in visible Spots
          </Text>
          <LittleSpacer/>
          <SectionList
            ListEmptyComponent={<ListEmptyText text={textNoSpots + ' with images found'}/>}
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

  /* View */

  return isEmpty(getSpotsWithImages()) ? renderNoImagesText() : renderSpotsWithImages();
};

export default ImageGallery;
