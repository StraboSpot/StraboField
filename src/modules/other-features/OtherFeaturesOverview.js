import React from 'react';
import {FlatList} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import OtherFeatureItem from './OtherFeatureItem';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {setSelectedAttributes} from '../spots/spots.slice';

const OtherFeaturesOverview = ({page}) => {
  const dispatch = useDispatch();
  const featuresData = useSelector(state => state.spot.selectedSpot.properties.other_features);

  const renderFeature = (feature) => {
    return (
      <OtherFeatureItem
        editFeature={() => {
          dispatch(setNotebookPageVisible(page.key));
          dispatch(setSelectedAttributes([feature]));
        }}
        feature={feature}
      />
    );
  };

  return (
    <FlatList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={<ListEmptyText text={'No Other Features'}/>}
      data={featuresData}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({item}) => renderFeature(item)}
    />
  );
};
export default OtherFeaturesOverview;
