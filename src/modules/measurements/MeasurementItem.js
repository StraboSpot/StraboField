import React from 'react';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import MeasurementLabel from './MeasurementLabel';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import * as themes from '../../shared/styles.constants';
import {useTags} from '../tags';
import FeatureTagsList from '../tags/FeatureTagsList';

// Render a measurement item in a list
const MeasurementItem = ({
                           isDetail,
                           isSelectMode,
                           item,
                           onPress,
                           selectedIds,
                         }) => {

  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const selectedFeaturesForTagging = useSelector(state => state.spot.selectedAttributes) || [];
  const spot = useSelector(state => state.spot.selectedSpot);

  const {setFeaturesSelectedForMultiTagging} = useTags();

  const isFeatureSelectedForTagging = selectedFeaturesForTagging.some(feature => feature.id === item.id);
  const isSelected = selectedIds.includes(item.id);
  const isInverse = isSelected && !isSelectMode;  // accent-highlight the currently-edited item, but not in Select mode

  const onMeasurementPress = () => {
    if (isMultipleFeaturesTaggingEnabled) setFeaturesSelectedForMultiTagging(item);
    else onPress();
  };

  if (!isEmpty(item)) {
    return (
      <ListItem
        containerStyle={isInverse ? commonStyles.listItemInverse
          : [commonStyles.listItem, {backgroundColor: themes.SECONDARY_BACKGROUND_COLOR}]}
        key={item.id}
        onPress={() => onMeasurementPress()}
        pad={5}
      >
        {isMultipleFeaturesTaggingEnabled && (
          <ListItem.CheckBox
            checked={isFeatureSelectedForTagging}
            onPress={() => onMeasurementPress()}
          />
        )}
        {isSelectMode && (
          <ListItem.CheckBox
            checked={isSelected}
            onPress={() => onMeasurementPress()}
          />
        )}
        <ListItem.Content>
          <ListItem.Title style={isInverse ? commonStyles.listItemTitleInverse : commonStyles.listItemTitle}>
            <MeasurementLabel isDetail={isDetail} item={item}/>
          </ListItem.Title>
          <FeatureTagsList featureId={item.id} spotId={spot.properties.id}/>
        </ListItem.Content>
        {!isMultipleFeaturesTaggingEnabled && !isSelectMode && <ListItem.Chevron/>}
      </ListItem>
    );
  }
};

export default MeasurementItem;
