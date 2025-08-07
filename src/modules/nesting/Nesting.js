import React, {useEffect, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import useNesting from './useNesting';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import {ImageCard, useImages, useImageThumbnails} from '../images';
import {PAGE_KEYS} from '../page/page.constants';
import ReturnToOverviewButton from '../page/ui/ReturnToOverviewButton';
import {SpotsListItem, useSpots} from '../spots';

const Nesting = () => {
  console.log('Rendering Nesting');
  const [childrenGenerations, setChildrenGenerations] = useState(null);
  const [images, setImages] = useState([]);
  const [parentGenerations, setParentGenerations] = useState(null);

  const {getChildrenGenerationsSpots, getParentGenerationsSpots} = useNesting();
  const {handleSpotSelected} = useSpots();
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

  useEffect(() => {
    console.log('UE Nesting [spots, selectedSpot]', spots, selectedSpot);
    if (notebookPageVisible === PAGE_KEYS.NESTING) updateNest();
  }, [activeDatasetsIds, spots, selectedSpot]);

  const renderImage = async (image, index) => {
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
        onPress={() => handleSpotSelected(spot)}
        spot={spot}
      />
    );
  };

  const renderGeneration = (type, generation, i, length) => {
    const levelNum = type === 'Parents' ? length - i : i + 1;
    const generationText = levelNum + (levelNum === 1 ? ' Level' : ' Levels') + (type === 'Parents' ? ' Up' : ' Down');
    const groupedGeneration = generation.reduce(
      (r, v, i, a, k = v.properties.image_basemap) => ((r[k] || (r[k] = [])).push(v), r), {});
    console.log('groupedGeneration', groupedGeneration);
    return (
      <>
        {type === 'Children' && (
          <Icon type={'material-icons'} name={'south'} containerStyle={{paddingLeft: 8, alignItems: 'flex-start'}}/>
        )}
        <Text style={{paddingLeft: 10}}>{generationText}</Text>
        <FlatList
          listKey={type + i}
          keyExtractor={index => type + index}
          data={Object.entries(groupedGeneration)}
          renderItem={({item, index}) => renderGroup(type, i, item, index)}
        />
        {type === 'Parents' && (
          <Icon type={'material-icons'} name={'north'} containerStyle={{paddingLeft: 8, alignItems: 'flex-start'}}/>
        )}
      </>
    );
  };

  const renderGenerations = (type) => {
    const generationData = type === 'Parents' ? parentGenerations : childrenGenerations;
    if (!isEmpty(generationData)) {
      return (
        <FlatList
          listKey={type}
          keyExtractor={(item, index) => type + index}
          data={type === 'Parents' ? generationData.reverse() : generationData}
          renderItem={({item, index}) => renderGeneration(type, item, index, generationData.length)}
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
            listKey={type + i + b}
            keyExtractor={item => 'NestedItem' + item.properties.id.toString()}
            data={group}
            renderItem={({item}) => renderName(item)}
            ItemSeparatorComponent={FlatListItemSeparator}
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
    if (!isEmpty(selectedSpot)) {
      console.log('Updating Nest for Selected Spot ...');
      console.log('Selected Spot:', selectedSpot);
      const parentSpots = getParentGenerationsSpots(selectedSpot, 10);
      setParentGenerations(parentSpots);
      const childrenSpots = getChildrenGenerationsSpots(selectedSpot, 10);
      setChildrenGenerations(childrenSpots);

      // Get All Images (Image Basemaps) Used in Nest
      const allSpotsInNest = [...parentSpots.flat(Infinity), ...childrenSpots.flat(Infinity), selectedSpot];
      console.log(allSpotsInNest);
      const allImagesInNest = allSpotsInNest.reduce((acc, spot) => {
        const imageBasemapId = spot.properties?.image_basemap;
        if (imageBasemapId && !acc.find(a => a.id.toString() === imageBasemapId.toString())) {
          const image = getImageByImageId(spot.properties.image_basemap);
          return isEmpty(image) ? acc : [...acc, image];
        }
        else return acc;
      }, []);
      setImages(allImagesInNest);
    }
  };

  return (
    <View style={{flex: 1}}>
      <ReturnToOverviewButton/>
      <SectionDivider dividerText={'Nesting'}/>
      <FlatList
        ListHeaderComponent={renderGenerations('Parents')}
        ListFooterComponent={renderGenerations('Children')}
        keyExtractor={item => 'NestedItem' + item.properties.id.toString()}
        data={[selectedSpot]}
        renderItem={({item}) => renderSelf(item)}
      />
    </View>
  );
};

export default Nesting;
