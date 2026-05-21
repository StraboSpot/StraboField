import React from 'react';

import {Icon, Image} from '@rn-vui/base';

import {imageStyles} from './index';
import placeholderImage from '../../assets/images/noimage.jpg';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';

const PlaceholderImageIcon = ({isConnected, isInternetReachable}) => {
  console.log('PlaceholderImageIcon: isConnected and isInternetReachable', isConnected, isInternetReachable);
  if (isInternetReachable && isConnected) {
    return (
      <>
        <Icon
          color={PRIMARY_ACCENT_COLOR}
          disabled={!isInternetReachable}
          name={'download'}
          size={35}
          type={'material-community'}
        />
      </>
    );
  }
  else return <Image source={placeholderImage} style={imageStyles.thumbnail}/>;
};

export default React.memo(PlaceholderImageIcon);
