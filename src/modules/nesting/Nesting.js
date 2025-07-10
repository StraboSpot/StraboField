import React, {useEffect, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import useNesting from './useNesting';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import {ImageThumbnail} from '../images';
import {PAGE_KEYS} from '../page/page.constants';
import ReturnToOverviewButton from '../page/ui/ReturnToOverviewButton';
import {SpotsListItem, useSpots} from '../spots';

const Nesting = () => {
  console.log('Rendering Nesting');

  const {getChildrenGenerationsSpots, getParentGenerationsSpots} = useNesting();
  const {handleSpotSelected} = useSpots();

  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const pagesStack = useSelector(state => state.notebook.visibleNotebookPagesStack);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);

  const [childrenGenerations, setChildrenGenerations] = useState(null);
  const [parentGenerations, setParentGenerations] = useState(null);

  const notebookPageVisible = !isEmpty(pagesStack) && pagesStack.slice(-1)[0];

  useEffect(() => {
    console.log('UE Nesting [spots, selectedSpot]', spots, selectedSpot);
    if (notebookPageVisible === PAGE_KEYS.NESTING) updateNest();
  }, [activeDatasetsIds, spots, selectedSpot]);

  const renderItem = (spot) => {
    if (spot && spot.properties) {
      if (spot.properties.image_basemap) {
        return (
          <View style={{flex: 1, flexDirection: 'row'}}>
            <View style={{alignSelf: 'center'}}>
              <ImageThumbnail imageId={spot.properties.image_basemap}/>
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
            <ImageThumbnail imageId={imageBasemapKey}/>
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
      setParentGenerations(getParentGenerationsSpots(selectedSpot, 10));
      setChildrenGenerations(getChildrenGenerationsSpots(selectedSpot, 10));
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
