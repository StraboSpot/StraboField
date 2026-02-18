import React from 'react';

import {AvatarWrapper} from './';
import {useSpots} from '../../../modules/spots';

const SpotGeometryAvatar = ({spot}) => {
  /* Data Hooks */

  const {getSpotGeometryIconSource} = useSpots();

  /* View */

  return (
    <AvatarWrapper
      size={20}
      source={getSpotGeometryIconSource(spot)}
    />
  );
};

export default SpotGeometryAvatar;
