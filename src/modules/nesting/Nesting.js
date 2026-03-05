import React, {useEffect, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import useNesting from './useNesting';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import {ImageCard, useImages, useImageThumbnails} from '../images';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {SpotsListItem, useSpots} from '../spots';

const Nesting = () => {
  console.log('Rendering Nesting');

  /* Data Hooks */

  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const pagesStack = useSelector(state => state.notebook.visibleNotebookPagesStack);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);

  const {getImageByImageId} = useImages();
  const [images, setImages] = useState([]);
  const {
    areImageThumbnailsLoading, imageThumbnailURIs, setAreImageThumbnailsLoading, setImageThumbnailURIs,
  } = useImageThumbnails({images});
  const {getChildrenGenerationsSpots, getParentGenerationsSpots} = useNesting();
  const {handleSpotSelected} = useSpots();

  /* Local State */

  const [childrenGenerations, setChildrenGenerations] = useState(null);
  const [parentGenerations, setParentGenerations] = useState(null);

  /* Derived Variables */

  const notebookPageVisible = !isEmpty(pagesStack) && pagesStack.slice(-1)[0];

  /* Side Effects */

  useEffect(() => {
    console.log('UE Nesting [spots, selectedSpot]', spots, selectedSpot);
    if (notebookPageVisible === PAGE_KEYS.NESTING) updateNest();
  }, [activeDatasetsIds, spots, selectedSpot]);

  /* Logic Helpers */

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

  /* Render Functions */

  const renderGeneration = (type, generation, i, length) => {
    const levelNum = type === 'Parents' ? length - i : i + 1;
    const generationText = levelNum + (levelNum === 1 ? ' Level' : ' Levels') + (type === 'Parents' ? ' Up' : ' Down');
    const groupedGeneration = generation.reduce((r, v) => {
      const k = v.properties.image_basemap;
      if (!r[k]) r[k] = [];
      r[k].push(v);
      return r;
    }, {});
    console.log('groupedGeneration', groupedGeneration);
    return (
      <>
        {type === 'Children' && (
          <Icon containerStyle={{paddingLeft: 8, alignItems: 'flex-start'}} name={'south'} type={'material-icons'}/>
        )}
        <Text style={{paddingLeft: 10}}>{generationText}</Text>
        <FlatList
          data={Object.entries(groupedGeneration)}
          keyExtractor={index => type + index}
          listKey={type + i}
          renderItem={({item, index}) => renderGroup(type, i, item, index)}
        />
        {type === 'Parents' && (
          <Icon containerStyle={{paddingLeft: 8, alignItems: 'flex-start'}} name={'north'} type={'material-icons'}/>
        )}
      </>
    );
  };

  const renderGenerations = (type) => {
    const generationData = type === 'Parents' ? parentGenerations : childrenGenerations;
    if (!isEmpty(generationData)) {
      return (
        <FlatList
          data={type === 'Parents' ? generationData.reverse() : generationData}
          keyExtractor={(item, index) => type + index}
          listKey={type}
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
            ItemSeparatorComponent={FlatListItemSeparator}
            data={group}
            keyExtractor={item => 'NestedItem' + item.properties.id.toString()}
            listKey={type + i + b}
            renderItem={({item}) => renderName(item)}
          />
        </View>
      </View>
    );
  };

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

  const renderSelf = (self) => {
    return (
      <View style={{borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'black'}}>
        {renderItem(self)}
      </View>
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <PageHeader pageTitle={'Nesting'}/>
      <FlatList
        ListFooterComponent={renderGenerations('Children')}
        ListHeaderComponent={renderGenerations('Parents')}
        data={[selectedSpot]}
        keyExtractor={item => 'NestedItem' + item.properties.id.toString()}
        renderItem={({item}) => renderSelf(item)}
      />
    </View>
  );
};

export default Nesting;
