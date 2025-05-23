import React, {useEffect, useState} from 'react';
import {FlatList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import usePetrology from './usePetrology';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {setModalVisible} from '../home/home.slice';
import BasicListItem from '../page/BasicListItem';
import BasicPageDetail from '../page/BasicPageDetail';
import ReturnToOverviewButton from '../page/ui/ReturnToOverviewButton';
import {setSelectedAttributes} from '../spots/spots.slice';

const ReactionTexturesPage = ({page}) => {
  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const [selectedReaction, setSelectedReaction] = useState({});
  const [isDetailView, setIsDetailView] = useState(false);

  const {getMineralTitle} = usePetrology();

  useEffect(() => {
    console.log('UE ReactionTexturesPage []');
    return () => dispatch(setSelectedAttributes([]));
  }, []);

  useEffect(() => {
    console.log('UE ReactionTexturesPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (isEmpty(selectedAttributes)) setSelectedReaction({});
    else {
      setSelectedReaction(selectedAttributes[0]);
      setIsDetailView(true);
    }
  }, [selectedAttributes, spot]);

  const addReaction = () => {
    dispatch(setModalVisible({modal: page.key}));
  };

  const editReaction = (reaction) => {
    setIsDetailView(true);
    setSelectedReaction(reaction);
    dispatch(setModalVisible({modal: null}));
  };

  const getExistingMineralsText = () => {
    if (!spot.properties.pet || isEmpty(spot.properties.pet.minerals) || !Array.isArray(spot.properties.pet.minerals)) {
      return 'No Minerals at this Spot';
    }
    else {
      const existingMinerals = spot.properties.pet.minerals.map(mineral => getMineralTitle(mineral));
      const existingMineralsSorted = existingMinerals.slice().sort((a, b) => a.localeCompare(b));
      return existingMineralsSorted.join(' - ');
    }
  };

  const renderReactionDetail = () => {
    return (
      <BasicPageDetail
        closeDetailView={() => setIsDetailView(false)}
        page={page}
        selectedFeature={selectedReaction}
        groupKey={'pet'}
      />
    );
  };

  const renderReactionsMain = () => {
    return (
      <View style={{flex: 1}}>
        <ReturnToOverviewButton/>
        <View>
          <SectionDivider
            dividerText={'Minerals Added to this Spot'}
          />
          <ListItem containerStyle={commonStyles.listItem}>
            <ListItem.Content>
              <ListItem.Title style={commonStyles.listItemTitle}>{getExistingMineralsText()}</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        </View>
        <SectionDividerWithRightButton
          dividerText={page.label}
          onPress={addReaction}
        />
        <FlatList
          data={spot.properties.pet && spot.properties.pet[page.key]
            && spot.properties.pet[page.key].slice().sort(
              (a, b) => (a[page.key] || 'Unknown').localeCompare((b[page.key] || 'Unknown')))}
          renderItem={({item}) => <BasicListItem page={page} item={item} editItem={editReaction}/>}
          keyExtractor={item => item.id.toString()}
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={'No ' + page.label.toLowerCase() + ' at this Spot.'}/>}
        />
      </View>
    );
  };

  return isDetailView ? renderReactionDetail() : renderReactionsMain();
};

export default ReactionTexturesPage;
