import React from 'react';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import ThreeDStructureLabel from './ThreeDStructureLabel';
import commonStyles from '../../shared/common.styles';
import * as themes from '../../shared/styles.constants';
import {useTags} from '../tags';
import FeatureTagsList from '../tags/FeatureTagsList';

function ThreeDStructureItem({
                               edit3dStructure,
                               item,
                             }) {
  /* Data Hooks */

  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const selectedFeaturesForTagging = useSelector(state => state.spot.selectedAttributes) || [];
  const spot = useSelector(state => state.spot.selectedSpot);

  const {setFeaturesSelectedForMultiTagging} = useTags();

  /* Derived Variables */

  const isFeatureSelectedForTagging = selectedFeaturesForTagging.some(f => f.id === item.id);

  /* Logic Helpers */

  const editFeature = (feature) => {
    if (isMultipleFeaturesTaggingEnabled) setFeaturesSelectedForMultiTagging(feature);
    else edit3dStructure(feature);
  };

  /* View */

  return (
    <ListItem
      containerStyle={[commonStyles.listItem, {backgroundColor: themes.SECONDARY_BACKGROUND_COLOR}]}
      key={item.id}
      onPress={() => editFeature(item)}
    >
      {isMultipleFeaturesTaggingEnabled && (
        <ListItem.CheckBox
          checked={isFeatureSelectedForTagging}
          onPress={() => editFeature(item)}
        />
      )}
      <ListItem.Content style={{overflow: 'hidden'}}>
        <ListItem.Title style={commonStyles.listItemTitle}>
          <ThreeDStructureLabel item={item}/>
        </ListItem.Title>
        <FeatureTagsList featureId={item.id} spotId={spot.properties.id}/>
      </ListItem.Content>
      {!isMultipleFeaturesTaggingEnabled && <ListItem.Chevron/>}
    </ListItem>
  );
}

export default ThreeDStructureItem;
