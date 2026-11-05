import React from 'react';
import {FlatList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/helpers';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import SectionDivider from '../../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../../shared/ui/SectionDividerWithRightButton';
import useForm from '../../form/useForm';
import {setActiveModal} from '../../home/home.slice';
import FeatureDetail from '../../page/FeatureDetail';
import {getFeatureTitle} from '../../page/featureLabels.helpers';
import FeatureListItem from '../../page/FeatureListItem';
import PageHeader from '../../page/PageHeader';
import useFeatureDetailView from '../../page/useFeatureDetailView';
import {getMineralTitle} from '../minerals/minerals.helpers';

const ReactionTexturesPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {closeDetailView, isDetailView, openDetailView, selectedFeature} = useFeatureDetailView();
  const {getLabel, getLabels} = useForm();

  /* Logic Helpers */

  const addReaction = () => dispatch(setActiveModal({modal: page.key}));

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

  /* Render Functions */

  const renderReactionDetail = () => {
    return (
      <FeatureDetail
        closeDetailView={closeDetailView}
        groupKey={'pet'}
        isReadOnly={isReadOnly}
        page={page}
        selectedFeature={selectedFeature}
      />
    );
  };

  const renderReactionsMain = () => {
    return (
      <View style={{flex: 1}}>
        <PageHeader pageTitle={page.label}/>
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
        {isReadOnly ? <SectionDivider dividerText={page.label}/> : (
          <SectionDividerWithRightButton
            dividerText={page.label}
            onPress={addReaction}
          />
        )}
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={
            <ListEmptyText
              onPress={!isReadOnly && addReaction}
              text={'No ' + page.label.toLowerCase() + ' at this Spot.'}
            />
          }
          data={spot.properties.pet && spot.properties.pet[page.key]
            && spot.properties.pet[page.key].slice().sort(
              (a, b) => getFeatureTitle(page.key, a, getLabel, getLabels)
                .localeCompare(getFeatureTitle(page.key, b, getLabel, getLabels)))}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => <FeatureListItem editItem={openDetailView} item={item} page={page}/>}
        />
      </View>
    );
  };

  /* View */

  return isDetailView ? renderReactionDetail() : renderReactionsMain();
};

export default ReactionTexturesPage;
