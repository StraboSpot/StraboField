import React, {useEffect, useState} from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import OtherFeatureDetail from './OtherFeatureDetail';
import OtherFeatureItem from './OtherFeatureItem';
import {getNewId, isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import PageHeader from '../page/PageHeader';
import {setSelectedAttributes} from '../spots/spots.slice';

const OtherFeaturesPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const otherFeatures = useSelector(state => state.project.project?.other_features);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Local State */

  const [isFeatureDetailVisible, setIsFeatureDetailVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState({});

  /* Side Effects */

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

  /* Logic Helpers */

  const addFeature = () => {
    setSelectedFeature({id: getNewId()});
    setIsFeatureDetailVisible(true);
  };

  const editFeature = (feature) => {
    setSelectedFeature(feature);
    setIsFeatureDetailVisible(true);
    // In Redux too, so an edit from elsewhere can hand the open detail view back its updated record
    dispatch(setSelectedAttributes([feature]));
  };

  /* Render Functions */

  const renderFeature = (feature) => {
    return (
      <OtherFeatureItem editFeature={() => editFeature(feature)} feature={feature}/>
    );
  };

  const renderFeatureDetail = () => {
    return (
      <>
        <OtherFeatureDetail
          featureTypes={otherFeatures}
          hideFeatureDetail={() => setIsFeatureDetailVisible(false)}
          isReadOnly={isReadOnly}
          page={page}
          renderFeature={feature => renderFeature(feature)}
          selectedFeature={selectedFeature}
        />
      </>
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

  return (
    <>
      {isFeatureDetailVisible ? renderFeatureDetail() : renderFeaturesList()}
    </>
  );
};

export default OtherFeaturesPage;
