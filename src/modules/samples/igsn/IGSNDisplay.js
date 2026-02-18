import React from 'react';
import {View} from 'react-native';

import {Image} from '@rn-vui/base';

import igsnStyles from './igsn.styles';
import IGSNLogo from '../../../assets/images/logos/IGSN_Logo_200.jpg';

const IGSNDisplay = ({item}) => {
  return (
    <View style={igsnStyles.logoDisplayContainer}>
      {item.isOnMySesar && (
        <Image
          source={IGSNLogo}
          style={igsnStyles.IGSNLogo}
        />
      )}
    </View>
  );
};

export default IGSNDisplay;
