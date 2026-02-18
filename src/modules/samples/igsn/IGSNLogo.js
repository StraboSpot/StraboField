import React from 'react';
import {View} from 'react-native';

import {Image} from '@rn-vui/base';

import igsnStyles from './igsn.styles';
import IGSNLogoSource from '../../../assets/images/logos/IGSN_Logo_200.jpg';

const IGSNLogo = ({item}) => {
  return (
    <View style={igsnStyles.logoDisplayContainer}>
      {item.isOnMySesar && (
        <Image
          source={IGSNLogoSource}
          style={igsnStyles.IGSNLogo}
        />
      )}
    </View>
  );
};

export default IGSNLogo;
