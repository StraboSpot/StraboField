import React, {useEffect, useState} from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import OtherFeatureDetail from './OtherFeatureDetail';
import OtherFeatureItem from './OtherFeatureItem';
import {getNewId, isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import NotebookContentTopSection from '../../shared/ui/NotebookContentTopSection';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {setSelectedAttributes} from '../spots/spots.slice';

const OtherFeaturesPage = () => {
  const [isFeatureDetailVisible, setIsFeatureDetailVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState({});
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);
  const otherFeatures = useSelector(state => state.project.project?.other_features);
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);

  useEffect(() => {
    console.log('UE OtherFeaturesPage []');
    return () => dispatch(setSelectedAttributes([]));
  }, []);

  useEffect(() => {
    console.log('UE OtherFeaturesPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (isEmpty(selectedAttributes)) setSelectedFeature({});
    else if (!isMultipleFeaturesTaggingEnabled) {
      setSelectedFeature(selectedAttributes[0]);
      setIsFeatureDetailVisible(true);
    }
  }, [selectedAttributes, spot]);

  const addFeature = () => {
    setSelectedFeature({id: getNewId()});
    setIsFeatureDetailVisible(true);
  };

  const editFeature = (feature) => {
    setSelectedFeature(feature);
    setIsFeatureDetailVisible(true);
  };

  const renderFeature = (feature) => {
    return (
      <OtherFeatureItem feature={feature} editFeature={() => editFeature(feature)}/>
    );
  };

  return (
    <>
      {!isFeatureDetailVisible && (
        <View>
          <NotebookContentTopSection/>
          {!isMultipleFeaturesTaggingEnabled && (
            <SectionDividerWithRightButton
              dividerText={'Other Features'}
              onPress={addFeature}
            />
          )}
          <FlatList
            data={spot.properties.other_features}
            renderItem={item => renderFeature(item.item)}
            keyExtractor={item => item.id.toString()}
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText text={'There are no other features at this Spot.'}/>}
          />
        </View>
      )}
      {isFeatureDetailVisible && (
        <OtherFeatureDetail
          featureTypes={otherFeatures}
          hideFeatureDetail={() => setIsFeatureDetailVisible(false)}
          selectedFeature={selectedFeature}
          renderFeature={feature => renderFeature(feature)}
        />)}
    </>
  );
};

export default OtherFeaturesPage;
