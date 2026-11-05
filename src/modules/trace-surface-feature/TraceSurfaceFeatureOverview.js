import React from 'react';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {getTraceSurfaceFeatureLabel, getTraceSurfaceFeatureText} from './traceSurfaceFeature.helpers';
import commonStyles from '../../shared/common.styles';
import {MEDIUMGREY} from '../../shared/styles.constants';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import useForm from '../form/useForm';

const TraceSurfaceFeatureOverview = ({onPress}) => {
  /* Data Hooks */

  const spot = useSelector(state => state.spot.selectedSpot);

  const {getLabel} = useForm();

  /* Derived Variables */

  const featureText = getTraceSurfaceFeatureText(spot, getLabel);

  /* View */

  if (!featureText) {
    return <ListEmptyText onPress={onPress} text={'No ' + getTraceSurfaceFeatureLabel(spot)}/>;
  }
  return (
    <ListItem containerStyle={commonStyles.listItem} onPress={onPress}>
      <ListItem.Content style={{overflow: 'hidden'}}>
        <ListItem.Title style={commonStyles.listItemTitle}>{featureText}</ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron color={MEDIUMGREY}/>
    </ListItem>
  );
};

export default TraceSurfaceFeatureOverview;
