import React, {useEffect, useState} from 'react';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import OtherFeatureLabel from './OtherFeatureLabel';
import commonStyles from '../../shared/common.styles';
import * as themes from '../../shared/styles.constants';
import {useTags} from '../tags';
import FeatureTagsList from '../tags/FeatureTagsList';

const OtherFeatureItem = ({editFeature, feature}) => {
  /* Data Hooks */

  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {setFeaturesSelectedForMultiTagging} = useTags();

  /* Local State */

  const [featureSelectedForTagging, setFeatureSelectedForTagging] = useState(false);

  /* Side Effects */

  useEffect(() => {
    console.log('UE OtherFeatureItem [isMultipleFeaturesTaggingEnabled]', isMultipleFeaturesTaggingEnabled);
    if (!isMultipleFeaturesTaggingEnabled) setFeatureSelectedForTagging(false);
  }, [isMultipleFeaturesTaggingEnabled]);

  /* Logic Helpers */

  const editFeatureItem = (featureItem) => {
    if (isMultipleFeaturesTaggingEnabled) setFeatureSelectedForTagging(setFeaturesSelectedForMultiTagging(featureItem));
    else editFeature(featureItem);
  };

  /* View */

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
