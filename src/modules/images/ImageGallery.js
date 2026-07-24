import React, {useCallback, useMemo, useState} from 'react';
import {SectionList, Text, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';

import {ImagesList, imageStyles} from '.';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {setLoadingStatus} from '../home/home.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import useProject from '../project/useProject';
import {useSpots} from '../spots';
import SpotQuery from '../spots/SpotQuery';

const SECTIONS_PER_PAGE = 30;
let sortedSpotsWithImages = [];

const ImageGallery = ({openSpotInNotebook}) => {
  console.log('Rendering ImageGallery...');

  /* Data Hooks */

  const dispatch = useDispatch();

  const navigate = useNavigation();
  const {isReadOnlySpot} = useProject();
  const {getActiveSpotsObj} = useSpots();

  /* Local State */

  const activeSpotsObj = useMemo(() => getActiveSpotsObj(), [getActiveSpotsObj]);
  const activeSpots = useMemo(() => Object.values(activeSpotsObj), [activeSpotsObj]);

  const [scopeText, setScopeText] = useState('');
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [visibleSectionCount, setVisibleSectionCount] = useState(SECTIONS_PER_PAGE);

  const scopeSuffix = scopeText ? ` ${scopeText}` : '';
  const filterPrefix = scopeText ? 'Filtered Results: ' : '';

  const resetAndSetSpotsSorted = useCallback((val) => {
    setVisibleSectionCount(SECTIONS_PER_PAGE);
    setSpotsSorted(val);
  }, []);

  /* Event Handlers */

  const handleOpenImage = async (image) => {
    dispatch(setLoadingStatus({view: 'home', bool: true}));
    console.log('Opening image', image.id, '...');
    navigate.navigate('ImageSlider', {selectedImage: image, sortedSpotsWithImages: sortedSpotsWithImages});
    dispatch(setLoadingStatus({view: 'home', bool: false}));
  };

  /* Logic Helpers */

  const loadMoreSections = useCallback(() => {
    setVisibleSectionCount(prev => prev + SECTIONS_PER_PAGE);
  }, []);

  /* Render Functions */

  const renderImagesInSpot = (images, section) => {
    const isReadOnlyImages = !isEmpty(section.spot) && isReadOnlySpot(section.spot.properties.id);
    return (
      <ImagesList
        images={images}
        isReadOnlyImages={isReadOnlyImages}
        isThumbnailOnly
        onOpenImage={handleOpenImage}
        spotWithImage={section.spot}
      />
    );
  };

  const renderNoImagesText = () => {
    return <ListEmptyText text={'No Images in Visible Datasets'}/>;
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

  /* View */
  const renderSpotsWithImages = () => {
    const spotsWithImages = JSON.parse(JSON.stringify(spotsSorted.filter(spot => !isEmpty(spot.properties.images))));
    sortedSpotsWithImages = spotsWithImages.map((spot) => {
      const sortedImages = JSON.parse(JSON.stringify(spot.properties.images))
        .sort((imgA, imgB) => (imgA?.title?.toString() || 'UntitledA')
          .localeCompare(imgB?.title?.toString() || 'UntitledB'));  // alphabetize by name
      return {...spot, properties: {...spot.properties, images: sortedImages}};
    });
    let count = 0;
    const allSpotsAsSections = sortedSpotsWithImages.reduce((acc, spot) => {
      count += spot.properties.images.length;
      return [...acc, {spot: spot, data: [spot.properties.images]}];
    }, []);
    const spotsAsSections = allSpotsAsSections.slice(0, visibleSectionCount);

    return (
      <>
        <SpotQuery
          activeSpots={activeSpots}
          isImagesSearch={true}
          setScopeText={setScopeText}
          setSpotsSorted={resetAndSetSpotsSorted}
        />
        {isEmpty(spotsAsSections) ? <ListEmptyText text={`No Images${scopeSuffix}`}/> : (
          <View style={imageStyles.galleryImageContainer}>
            <LittleSpacer/>
            <Text style={[commonStyles.standardDescriptionText, {alignSelf: 'center'}]}>
              {filterPrefix}{count + (count === 1 ? ' Image' : ' Images')}{scopeSuffix}
            </Text>
            <LittleSpacer/>
            <SectionList
              keyExtractor={(item, index) => item + index}
              onEndReached={loadMoreSections}
              onEndReachedThreshold={0.5}
              renderItem={({item, section}) => renderImagesInSpot(item, section)}
              renderSectionHeader={({section}) => renderSectionHeader(section)}
              sections={spotsAsSections}
              stickySectionHeadersEnabled={true}
            />
          </View>
        )}
      </>
    );
  };


  /* View */

  const hasImages = activeSpots.some(spot => !isEmpty(spot.properties.images));
  return hasImages ? renderSpotsWithImages() : renderNoImagesText();
};

export default ImageGallery;
