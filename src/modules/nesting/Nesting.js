import React, {useEffect, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import NestingImageCard from './NestingImageCard';
import useNesting from './useNesting';
import {isEmpty, isSameId} from '../../shared/helpers';
import {BLACK, SAMPLES_COLOR} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import {openFeatureInNotebook} from '../notebook-panel/notebook.helpers';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import SampleListItem from '../samples/SampleListItem';
import SpotsListItem from '../spots/SpotsListItem';
import useSpots from '../spots/useSpots';

const Nesting = ({page}) => {
  console.log('Rendering Nesting');

  /* Data Hooks */

  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const pagesStack = useSelector(state => state.notebook.visibleNotebookPagesStack);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);

  const {getChildrenGenerationsSpots, getParentGenerationsSpots} = useNesting();
  const {handleSpotSelected} = useSpots();

  /* Local State */

  const [childrenGenerations, setChildrenGenerations] = useState(null);
  const [parentGenerations, setParentGenerations] = useState(null);

  /* Derived Variables */

  const notebookPageVisible = !isEmpty(pagesStack) && pagesStack.slice(-1)[0];

  /* Side Effects */

  useEffect(() => {
    console.log('UE Nesting [activeDatasetsIds, spots, selectedSpot]');
    if (notebookPageVisible === PAGE_KEYS.NESTING) updateNest();
  }, [activeDatasetsIds, spots, selectedSpot]);

  /* Event Handlers */

  // A legacy sample has no Spot to select, so select the Spot it is kept on and open the sample on its Samples
  // page. The page is opened after selecting, since selecting a Spot drops whatever feature was open.
  const handleLegacySamplePressed = ({legacySample, parentSpot}) => {
    handleSpotSelected(parentSpot);
    openFeatureInNotebook(dispatch, PAGE_KEYS.SAMPLES, legacySample);
  };

  /* Logic Helpers */

  // Group a generation's Spots by the image basemap they are on, with those on none grouped together
  const getImageBasemapGroups = (generation) => {
    const groups = new Map();
    generation.forEach((spot) => {
      const imageBasemapId = spot.properties.image_basemap;
      if (!groups.has(imageBasemapId)) groups.set(imageBasemapId, []);
      groups.get(imageBasemapId).push(spot);
    });
    return [...groups].map(([imageBasemapId, groupSpots]) => ({imageBasemapId, groupSpots}));
  };

  // Whether an image basemap is on a sample, searched for in every Dataset as the nest is. isSameId because the
  // server returns image ids as strings.
  const isSampleImageBasemap = imageBasemapId => !!imageBasemapId && !!Object.values(spots).find(
    spot => spot.properties.images?.some(image => isSameId(image.id, imageBasemapId)))?.properties.isSample;

  const updateNest = () => {
    if (!isEmpty(selectedSpot)) {
      console.log(`Updating Nest for ${selectedSpot.properties.isSample ? 'Sample\'s Parent Spot' : 'Selected Spot'}`,
        selectedSpot, '...');
      const parentSpots = getParentGenerationsSpots(selectedSpot, 10);
      setParentGenerations(parentSpots);
      const childrenSpots = getChildrenGenerationsSpots(selectedSpot, 10, true);
      setChildrenGenerations(childrenSpots);
    }
  };

  /* Render Functions */

  const renderGeneration = (type, generation, generationIndex, generationsCount) => {
    const levelNum = type === 'Parents' ? generationsCount - generationIndex : generationIndex + 1;
    const generationText = levelNum + (levelNum === 1 ? ' Level' : ' Levels') + (type === 'Parents' ? ' Up' : ' Down');
    return (
      <>
        {type === 'Children' && (
          <Icon containerStyle={{paddingLeft: 8, alignItems: 'flex-start'}} name={'south'} type={'material-icons'}/>
        )}
        <Text style={{paddingLeft: 10}}>{generationText}</Text>
        <FlatList
          data={getImageBasemapGroups(generation)}
          keyExtractor={({imageBasemapId}) => `${type}${imageBasemapId}`}
          renderItem={({item, index}) => renderGroup(item, index)}
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
          data={type === 'Parents' ? [...generationData].reverse() : generationData}
          keyExtractor={(item, index) => `${type}${index}`}
          renderItem={({item, index}) => renderGeneration(type, item, index, generationData.length)}
        />
      );
    }
  };

  const renderGroup = ({imageBasemapId, groupSpots}, groupIndex) => {
    const isGroupNestedInSample = isSampleImageBasemap(imageBasemapId);
    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          borderWidth: isGroupNestedInSample ? 2.5 : 1,
          borderColor: isGroupNestedInSample ? SAMPLES_COLOR : BLACK,
          marginLeft: 10,
          marginRight: 10,
          marginTop: 2,
          marginBottom: 2,
        }}
      >
        {!!imageBasemapId && <NestingImageCard imageBasemapId={imageBasemapId} index={groupIndex}/>}
        <View style={{flex: 1}}>
          <FlatList
            ItemSeparatorComponent={FlatListItemSeparator}
            data={groupSpots}
            keyExtractor={item => `NestedItem${item.properties.id}`}
            renderItem={({item}) => renderName(item)}
          />
        </View>
      </View>
    );
  };

  const renderItem = (spot) => {
    if (spot && spot.properties) {
      if (spot.properties.image_basemap) {
        return (
          <View style={{flex: 1, flexDirection: 'row'}}>
            <NestingImageCard imageBasemapId={spot.properties.image_basemap} index={0}/>
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
    if (spot.legacySample) {
      return (
        <SampleListItem
          isOutlined
          isShowAvatar
          onPress={() => handleLegacySamplePressed(spot)}
          parentSpot={spot.parentSpot}
          sample={spot.legacySample}
        />
      );
    }
    return (
      <SpotsListItem
        isSample={spot.properties?.isSample}
        onPress={() => handleSpotSelected(spot)}
        spot={spot}
      />
    );
  };

  const renderSelf = (self) => {
    const isSampleOrSampleChild = self.properties?.isSample || isSampleImageBasemap(self.properties?.image_basemap);
    return (
      <View style={{
        borderTopWidth: isSampleOrSampleChild ? 2.5 : 1,
        borderBottomWidth: isSampleOrSampleChild ? 2.5 : 1,
        borderColor: isSampleOrSampleChild ? SAMPLES_COLOR : BLACK,
      }}>
        {renderItem(self)}
      </View>
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <PageHeader pageTitle={page.label}/>
      <FlatList
        ListFooterComponent={renderGenerations('Children')}
        ListHeaderComponent={renderGenerations('Parents')}
        data={[selectedSpot]}
        keyExtractor={item => `NestedItem${item.properties.id}`}
        renderItem={({item}) => renderSelf(item)}
      />
    </View>
  );
};

export default Nesting;
