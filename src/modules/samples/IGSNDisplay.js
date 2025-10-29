import React from 'react';
import {View} from 'react-native';

import {Image} from '@rn-vui/base';

import sampleStyles from './samples.styles';
import IGSNLogo from '../../assets/images/logos/IGSN_Logo_200.jpg';

const IGSNDisplay = ({item}) => {
  return (
    <View style={sampleStyles.logoDisplayContainer}>
      {item.isOnMySesar && (
        <Image
          source={IGSNLogo}
          style={sampleStyles.IGSNLogo}
        />
      )}
    </View>
  );
};

export default IGSNDisplay;
