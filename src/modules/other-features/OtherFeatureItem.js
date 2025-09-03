import React, {useEffect, useState} from 'react';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import OtherFeatureLabel from './OtherFeatureLabel';
import commonStyles from '../../shared/common.styles';
import * as themes from '../../shared/styles.constants';
import FeatureTagsList from '../../shared/ui/FeatureTagsList';
import {useTags} from '../tags';

const OtherFeatureItem = ({editFeature, feature}) => {
  const spot = useSelector(state => state.spot.selectedSpot);
  const {setFeaturesSelectedForMultiTagging} = useTags();
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const [featureSelectedForTagging, setFeatureSelectedForTagging] = useState(false);

  useEffect(() => {
    console.log('UE OtherFeatureItem [isMultipleFeaturesTaggingEnabled]', isMultipleFeaturesTaggingEnabled);
    if (!isMultipleFeaturesTaggingEnabled) setFeatureSelectedForTagging(false);
  }, [isMultipleFeaturesTaggingEnabled]);

  const editFeatureItem = (featureItem) => {
    if (isMultipleFeaturesTaggingEnabled) setFeatureSelectedForTagging(setFeaturesSelectedForMultiTagging(featureItem));
    else editFeature(featureItem);
  };

  return (
    <ListItem
      containerStyle={[commonStyles.listItem,
        {backgroundColor: featureSelectedForTagging ? themes.PRIMARY_ACCENT_COLOR : themes.SECONDARY_BACKGROUND_COLOR}]}
      key={feature.id}
      onPress={() => editFeatureItem(feature)}
    >
      <ListItem.Content style={{overflow: 'hidden'}}>
        <ListItem.Title style={commonStyles.listItemTitle}>
          <OtherFeatureLabel item={feature}/>
        </ListItem.Title>
        <FeatureTagsList featureId={feature.id} spotId={spot.properties.id}/>
      </ListItem.Content>
      <ListItem.Chevron/>
    </ListItem>
  );
};
export default OtherFeatureItem;
