import React, {useEffect, useState} from 'react';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import MeasurementLabel from './MeasurementLabel';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import FeatureTagsList from '../tags/FeatureTagsList';
import {useTags} from '../tags';

// Render a measurement item in a list
const MeasurementItem = ({
                           isDetail,
                           item,
                           onPress,
                           selectedIds,
                         }) => {

  const spot = useSelector(state => state.spot.selectedSpot);
  const {setFeaturesSelectedForMultiTagging} = useTags();
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const [featureSelectedForTagging, setFeatureSelectedForTagging] = useState(false);

  useEffect(() => {
    console.log('UE MeasurementItem [isMultipleFeaturesTaggingEnabled]', isMultipleFeaturesTaggingEnabled);
    if (!isMultipleFeaturesTaggingEnabled) setFeatureSelectedForTagging(false);
  }, [isMultipleFeaturesTaggingEnabled]);

  const onMeasurementPress = () => {
    if (isMultipleFeaturesTaggingEnabled) setFeatureSelectedForTagging(setFeaturesSelectedForMultiTagging(item));
    else onPress();
  };

  if (!isEmpty(item)) {
    return (
      <ListItem
        containerStyle={selectedIds.includes(item.id) ? commonStyles.listItemInverse
          : [commonStyles.listItem, {
            backgroundColor: featureSelectedForTagging
              ? themes.PRIMARY_ACCENT_COLOR : themes.SECONDARY_BACKGROUND_COLOR,
          }]}
        key={item.id}
        onPress={() => onMeasurementPress()}
        pad={5}
      >
        <ListItem.Content>
          <ListItem.Title
            style={selectedIds.includes(item.id) ? commonStyles.listItemTitleInverse
              : commonStyles.listItemTitle}
          >
            <MeasurementLabel isDetail={isDetail} item={item}/>
          </ListItem.Title>
          <FeatureTagsList featureId={item.id} spotId={spot.properties.id}/>
        </ListItem.Content>
        <ListItem.Chevron/>
      </ListItem>
    );
  }
};

export default MeasurementItem;
