import React, {useEffect, useState} from 'react';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import ThreeDStructureLabel from './ThreeDStructureLabel';
import commonStyles from '../../shared/common.styles';
import * as themes from '../../shared/styles.constants';
import FeatureTagsList from '../../shared/ui/FeatureTagsList';
import {useTags} from '../tags';

function ThreeDStructureItem({
                               edit3dStructure,
                               item,
                             }) {
  const {setFeaturesSelectedForMultiTagging} = useTags();
  const spot = useSelector(state => state.spot.selectedSpot);
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const [featureSelectedForTagging, setFeatureSelectedForTagging] = useState(false);

  useEffect(() => {
    console.log('UE ThreeDStructureItem [isMultipleFeaturesTaggingEnabled]', isMultipleFeaturesTaggingEnabled);
    if (!isMultipleFeaturesTaggingEnabled) setFeatureSelectedForTagging(false);
  }, [isMultipleFeaturesTaggingEnabled]);

  const editFeature = (feature) => {
    if (isMultipleFeaturesTaggingEnabled) setFeatureSelectedForTagging(setFeaturesSelectedForMultiTagging(feature));
    else edit3dStructure(feature);
  };

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
