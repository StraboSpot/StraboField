import React from 'react';

import {Button, Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {setIsMapMoved} from '../../modules/maps/maps.slice';
import commonStyles from '../common.styles';
import * as themes from '../styles.constants';

// Update the Spots in the map
const UpdateSpotsInMapExtentButton = ({title, updateSpotsInMapExtent}) => {

  const dispatch = useDispatch();
  const isMapMoved = useSelector(state => state.map.isMapMoved);

  const onPress = () => {
    updateSpotsInMapExtent();
    dispatch(setIsMapMoved(false));
  };

  return (
    <Button
      containerStyle={{padding: 5, paddingTop: 0}}
      disabled={!isMapMoved}
      icon={
        <Icon
          color={isMapMoved ? themes.PRIMARY_ACCENT_COLOR : themes.MEDIUMGREY}
          containerStyle={{paddingRight: 5}}
          name={'sync-outline'}
          size={20}
          type={'ionicon'}
        />
      }
      onPress={onPress}
      title={title}
      titleStyle={commonStyles.standardButtonText}
      type={'outline'}
    />
  );
};

export default UpdateSpotsInMapExtentButton;
