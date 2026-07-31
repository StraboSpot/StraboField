import React from 'react';

import {AvatarWrapper} from './';
import {useSpots} from '../../../modules/spots';

const SpotGeometryAvatar = ({spot}) => {
  /* Data Hooks */

  const {getSampleSpotIconSource, getSpotGeometryIconSource} = useSpots();

  /* View */

  return (
    <AvatarWrapper
      size={20}
      source={spot.properties.isSample ? getSampleSpotIconSource() : getSpotGeometryIconSource(spot)}
    />
  );
};

export default SpotGeometryAvatar;
