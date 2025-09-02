import React from 'react';

import {Icon, Image} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {imageStyles} from './index';
import placeholderImage from '../../assets/images/noimage.jpg';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';

const PlaceholderImageIcon = () => {
  const {isInternetReachable, isConnected} = useSelector(state => state.connections.isOnline);

  if (isInternetReachable && isConnected) {
    return (
      <Icon
        color={PRIMARY_ACCENT_COLOR}
        name={'download'}
        size={35}
        type={'material-community'}
      />
    );
  }
  else return <Image source={placeholderImage} style={imageStyles.thumbnail}/>;
};

export default PlaceholderImageIcon;
