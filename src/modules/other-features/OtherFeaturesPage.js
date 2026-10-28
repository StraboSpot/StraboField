import React from 'react';
import {FlatList, View} from 'react-native';

import {useSelector} from 'react-redux';

import OtherFeatureDetail from './OtherFeatureDetail';
import OtherFeatureItem from './OtherFeatureItem';
import {getNewUUID} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import PageHeader from '../page/PageHeader';
import useFeatureDetailView from '../page/useFeatureDetailView';

const OtherFeaturesPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const otherFeatures = useSelector(state => state.project.project?.other_features);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {closeDetailView, isDetailView, openDetailView, selectedFeature} = useFeatureDetailView();

  /* Logic Helpers */

  const addFeature = () => openDetailView({id: getNewUUID()});

  /* Render Functions */

  const renderFeature = (feature) => {
    return (
      <OtherFeatureItem editFeature={() => openDetailView(feature)} feature={feature}/>
    );
  };

  const renderFeatureDetail = () => {
    return (
      <OtherFeatureDetail
        featureTypes={otherFeatures}
        hideFeatureDetail={closeDetailView}
        isReadOnly={isReadOnly}
        page={page}
        renderFeature={feature => renderFeature(feature)}
        selectedFeature={selectedFeature}
      />
    );
  };

  const renderFeaturesList = () => {
    return (
      <View style={{flex: 1}}>
        <PageHeader
          onPressAdd={addFeature}
          pageTitle={page.label}
          showAddButton={!isReadOnly}
          showFeaturesTagButton={!isReadOnly}
        />
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={
            <ListEmptyText onPress={!isReadOnly && addFeature} text={'There are no other features at this Spot.'}/>
          }
          data={spot.properties.other_features}
          keyExtractor={item => item.id.toString()}
          renderItem={item => renderFeature(item.item)}
        />
      </View>
    );
  };

  /* View */

  return isDetailView ? renderFeatureDetail() : renderFeaturesList();
};

export default OtherFeaturesPage;
