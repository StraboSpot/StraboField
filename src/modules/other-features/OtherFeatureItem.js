import React from 'react';

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
  const selectedFeaturesForTagging = useSelector(state => state.spot.selectedAttributes) || [];
  const spot = useSelector(state => state.spot.selectedSpot);

  const {setFeaturesSelectedForMultiTagging} = useTags();

  /* Derived Variables */

  const isFeatureSelectedForTagging = selectedFeaturesForTagging.some(f => f.id === feature.id);

  /* Logic Helpers */

  const editFeatureItem = (featureItem) => {
    if (isMultipleFeaturesTaggingEnabled) setFeaturesSelectedForMultiTagging(featureItem);
    else editFeature(featureItem);
  };

  /* View */

  return (
    <ListItem
      containerStyle={[commonStyles.listItem, {backgroundColor: themes.SECONDARY_BACKGROUND_COLOR}]}
      key={feature.id}
      onPress={() => editFeatureItem(feature)}
    >
      {isMultipleFeaturesTaggingEnabled && (
        <ListItem.CheckBox
          checked={isFeatureSelectedForTagging}
          onPress={() => editFeatureItem(feature)}
        />
      )}
      <ListItem.Content style={{overflow: 'hidden'}}>
        <ListItem.Title style={commonStyles.listItemTitle}>
          <OtherFeatureLabel item={feature}/>
        </ListItem.Title>
        <FeatureTagsList featureId={feature.id} spotId={spot.properties.id}/>
      </ListItem.Content>
      {!isMultipleFeaturesTaggingEnabled && <ListItem.Chevron/>}
    </ListItem>
  );
};
export default OtherFeatureItem;
