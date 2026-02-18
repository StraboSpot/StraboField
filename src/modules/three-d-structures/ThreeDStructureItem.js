import React, {useEffect, useState} from 'react';

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
  const spot = useSelector(state => state.spot.selectedSpot);

  const {setFeaturesSelectedForMultiTagging} = useTags();

  /* Local State */

  const [featureSelectedForTagging, setFeatureSelectedForTagging] = useState(false);

  /* Side Effects */

  useEffect(() => {
    console.log('UE ThreeDStructureItem [isMultipleFeaturesTaggingEnabled]', isMultipleFeaturesTaggingEnabled);
    if (!isMultipleFeaturesTaggingEnabled) setFeatureSelectedForTagging(false);
  }, [isMultipleFeaturesTaggingEnabled]);

  /* Logic Helpers */

  const editFeature = (feature) => {
    if (isMultipleFeaturesTaggingEnabled) setFeatureSelectedForTagging(setFeaturesSelectedForMultiTagging(feature));
    else edit3dStructure(feature);
  };

  /* View */

  return (
    <ListItem
      containerStyle={[commonStyles.listItem,
        {backgroundColor: featureSelectedForTagging ? themes.PRIMARY_ACCENT_COLOR : themes.SECONDARY_BACKGROUND_COLOR}]}
      key={item.id}
      onPress={() => editFeature(item)}
    >
      <ListItem.Content style={{overflow: 'hidden'}}>
        <ListItem.Title style={commonStyles.listItemTitle}>
          <ThreeDStructureLabel item={item}/>
        </ListItem.Title>
        <FeatureTagsList featureId={item.id} spotId={spot.properties.id}/>
      </ListItem.Content>
      <ListItem.Chevron/>
    </ListItem>
  );
}

export default ThreeDStructureItem;
