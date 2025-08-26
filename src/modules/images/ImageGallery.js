import React, {useState} from 'react';
import {SectionList, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';

import {ImagesList, imageStyles} from '.';
import {isEmpty} from '../../shared/Helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import uiStyles from '../../shared/ui/ui.styles';
import {setLoadingStatus} from '../home/home.slice';
import {PAGE_KEYS} from '../page/page.constants';
import {useSpots} from '../spots';
import SpotFilters from '../spots/SpotFilters';

const ImageGallery = ({openSpotInNotebook, updateSpotsInMapExtent}) => {
  console.log('Rendering ImageGallery...');

  const navigate = useNavigation();
  const {getActiveSpotsObj, getSpotsWithImages} = useSpots();

  const dispatch = useDispatch();

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);

  const [isReverseSort, setIsReverseSort] = useState(false);
  const [spotsSearched, setSpotsSearched] = useState(activeSpots);
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Active Datasets');

  let sortedSpotsWithImages = [];

  const openImage = async (image) => {
    dispatch(setLoadingStatus({view: 'home', bool: true}));
    console.log('Opening image', image.id, '...');
    navigate.navigate('ImageSlider', {selectedImage: image, sortedSpotsWithImages: sortedSpotsWithImages});
    dispatch(setLoadingStatus({view: 'home', bool: false}));
  };

  const renderImagesInSpot = (images) => {
    return <ImagesList images={images} isThumbnailOnly openImage={openImage}/>;
  };

  const renderNoImagesText = () => {
    return <ListEmptyText text={'No Images in Active Datasets'}/>;
  };

  const renderSectionHeader = ({spot}) => {
    return (
      <View style={uiStyles.sectionHeaderBackground}>
        <SectionDividerWithRightButton
          dividerText={spot.properties.name}
          buttonTitle={'View In Spot'}
          onPress={() => openSpotInNotebook(spot, PAGE_KEYS.IMAGES)}
        />
      </View>
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
          <SectionDivider dividerText={count + (count === 1 ? ' Image' : ' Images') + ' in active Spots'}/>
          <LittleSpacer/>
          <SectionList
            keyExtractor={(item, index) => item + index}
            sections={spotsAsSections}
            renderSectionHeader={({section}) => renderSectionHeader(section)}
            renderItem={({item}) => renderImagesInSpot(item)}
            ListEmptyComponent={<ListEmptyText text={textNoSpots + ' with images found'}/>}
            stickySectionHeadersEnabled={true}
          />
        </View>
      </>
    );
  };

  return isEmpty(getSpotsWithImages()) ? renderNoImagesText() : renderSpotsWithImages();
};

export default ImageGallery;
