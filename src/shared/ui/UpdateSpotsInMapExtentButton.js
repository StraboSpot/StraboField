import React from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {setIsMapMoved} from '../../modules/maps/maps.slice';
import * as themes from '../styles.constants';
import OutlineButton from './buttons/OutlineButton';

// Update the Spots in the map
const UpdateSpotsInMapExtentButton = ({title, updateSpotsInMapExtent}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isMapMoved = useSelector(state => state.map.isMapMoved);

  /* Event Handlers */

  const onPress = () => {
    updateSpotsInMapExtent();
    dispatch(setIsMapMoved(false));
  };

  /* View */

  return (
    <OutlineButton
      disabled={!isMapMoved}
      icon={{
        color: isMapMoved ? themes.PRIMARY_ACCENT_COLOR : themes.MEDIUMGREY,
        containerStyle: {paddingRight: 5},
        name: 'sync-outline',
        size: 20,
        type: 'ionicon',
      }}
      onPress={onPress}
      title={title}
    />
  );
};

export default UpdateSpotsInMapExtentButton;
