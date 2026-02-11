import React, {useEffect, useMemo, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import useNesting from './useNesting';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import {ImageCard, useImages, useImageThumbnails} from '../images';
import {PAGE_KEYS} from '../page/page.constants';
import PageHeader from '../page/PageHeader';
import {SpotsListItem, useSpots} from '../spots';

const Nesting = () => {
  console.log('Rendering Nesting');
  const [childrenGenerations, setChildrenGenerations] = useState(null);
  const [images, setImages] = useState([]);
  const [parentGenerations, setParentGenerations] = useState(null);

  const {getChildrenGenerationsSpots, getParentGenerationsSpots} = useNesting();
  const {getSpotWithThisSample, handleSpotSelected} = useSpots();
  const {getImageByImageId} = useImages();
  const {
    areImageThumbnailsLoading,
    imageThumbnailURIs,
    setAreImageThumbnailsLoading,
    setImageThumbnailURIs,
  } = useImageThumbnails({images});

  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const pagesStack = useSelector(state => state.notebook.visibleNotebookPagesStack);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);

  const notebookPageVisible = !isEmpty(pagesStack) && pagesStack.slice(-1)[0];

  const targetSpot = selectedSpot?.properties?.isSample ? getSpotWithThisSample(selectedSpot.properties.id)
    : selectedSpot;

  useEffect(() => {
    console.log('UE Nesting [spots, selectedSpot]', spots, selectedSpot);
    if (notebookPageVisible === PAGE_KEYS.NESTING) updateNest();
  }, [activeDatasetsIds, spots, selectedSpot]);

  const renderImage = (image, index) => {
    return (
      <ImageCard
        areImageThumbnailsLoading={areImageThumbnailsLoading}
        image={image}
        imageThumbnailURIs={imageThumbnailURIs}
        index={index}
        isThumbnailOnly
        setAreImageThumbnailsLoading={setAreImageThumbnailsLoading}
        setImageThumbnailURIs={setImageThumbnailURIs}
      />
    );
  };

  const renderItem = (spot) => {
    if (spot && spot.properties) {
      if (spot.properties.image_basemap) {
        const image = getImageByImageId(spot.properties.image_basemap);
        return (
          <View style={{flex: 1, flexDirection: 'row'}}>
            <View style={{alignSelf: 'center'}}>
              {renderImage(image, 0)}
            </View>
            <View style={{flex: 1, alignSelf: 'center'}}>
              {renderName(spot)}
            </View>
          </View>
        );
      }
      else return renderName(spot);
    }
  };

  const renderName = (spot) => {
    return (
      <SpotsListItem
        doShowSamples
        onPress={() => handleSpotSelected(spot)}
        spot={spot}
      />
    );
  };

  const renderGeneration = (type, generation, i, length) => {
    const levelNum = type === 'Parents' ? length - i : i + 1;
    const generationText = `${levelNum}${levelNum === 1 ? ' Level' : ' Levels'}${type === 'Parents' ? ' Up' : ' Down'}`;
    const groupedGeneration = generation.reduce(
      (r, v, i, a, k = v.properties.image_basemap) => ((r[k] || (r[k] = [])).push(v), r), {});
    console.log('groupedGeneration', groupedGeneration);
    return (
      <>
        {type === 'Children' && (
          <Icon containerStyle={{paddingLeft: 8, alignItems: 'flex-start'}} name={'south'} type={'material-icons'}/>
        )}
        <Text style={{paddingLeft: 10}}>{generationText}</Text>
        <FlatList
          data={Object.entries(groupedGeneration)}
          keyExtractor={index => `${type}${index}`}
          listKey={`${type}${i}`}
          renderItem={({item, index}) => renderGroup(type, i, item, index)}
        />
        {type === 'Parents' && (
          <Icon containerStyle={{paddingLeft: 8, alignItems: 'flex-start'}} name={'north'} type={'material-icons'}/>
        )}
      </>
    );
  };

  const reversedParentGenerations = useMemo(
    () => parentGenerations ? [...parentGenerations].reverse() : null,
    [parentGenerations],
  );

  const renderGenerations = (type) => {
    const generationData = type === 'Parents' ? reversedParentGenerations : childrenGenerations;
    if (!isEmpty(generationData)) {
      const sourceData = type === 'Parents' ? parentGenerations : childrenGenerations;
      return (
        <FlatList
          data={generationData}
          keyExtractor={(item, index) => `${type}${index}`}
          listKey={type}
          renderItem={({item, index}) => renderGeneration(type, item, index, sourceData.length)}
        />
      );
    }
  };

  const renderGroup = (type, i, [imageBasemapKey, group], b) => {
    console.log('renderGroup', type, i, group, b);
    const image = getImageByImageId(imageBasemapKey);
    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          borderWidth: 1,
          borderColor: 'black',
          marginLeft: 10,
          marginRight: 10,
          marginTop: 2,
          marginBottom: 2,
        }}
      >
        {imageBasemapKey !== 'undefined' && (
          <View style={{alignSelf: 'center'}}>
            {renderImage(image, b)}
          </View>
        )}
        <View style={{flex: 1}}>
          <FlatList
            ItemSeparatorComponent={FlatListItemSeparator}
            data={group}
            keyExtractor={item => `NestedItem${item.properties.id}`}
            listKey={`${type}${i}${b}`}
            renderItem={({item}) => renderName(item)}
          />
        </View>
      </View>
    );
  };

  const renderSelf = (self) => {
    return (
      <View style={{borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'black'}}>
        {renderItem(self)}
      </View>
    );
  };

  const updateNest = () => {
    if (!isEmpty(targetSpot)) {
      console.log(`Updating Nest for ${selectedSpot.properties.isSample ? 'Sample\'s Parent Spot' : 'Selected Spot'}`,
        targetSpot, '...');
      const parentSpots = getParentGenerationsSpots(targetSpot, 10);
      setParentGenerations(parentSpots);
      const childrenSpots = getChildrenGenerationsSpots(targetSpot, 10);
      setChildrenGenerations(childrenSpots);

      // Get All Images (Image Basemaps) Used in Nest
      const allSpotsInNest = [...parentSpots.flat(Infinity), ...childrenSpots.flat(Infinity), targetSpot];
      console.log(allSpotsInNest);
      const allImagesInNest = allSpotsInNest.reduce((acc, spot) => {
        const imageBasemapId = spot.properties?.image_basemap;
        if (imageBasemapId && !acc.find(a => a.id.toString() === imageBasemapId.toString())) {
          const image = getImageByImageId(spot.properties.image_basemap);
          return isEmpty(image) ? acc : [...acc, image];
        }
        else return acc;
      }, []);
      const newImageIds = allImagesInNest.map(img => img.id).sort().join(',');
      const currentImageIds = images.map(img => img.id).sort().join(',');
      if (newImageIds !== currentImageIds) setImages(allImagesInNest);
    }
  };

  return (
    <View style={{flex: 1}}>
      <PageHeader pageTitle={'Nesting'}/>
      <FlatList
        ListFooterComponent={renderGenerations('Children')}
        ListHeaderComponent={renderGenerations('Parents')}
        data={[targetSpot]}
        keyExtractor={item => `NestedItem${item.properties.id}`}
        renderItem={({item}) => renderSelf(item)}
      />
    </View>
  );
};

export default Nesting;
