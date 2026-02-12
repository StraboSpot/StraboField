import React from 'react';
import {View} from 'react-native';

import {Image} from '@rn-vui/base';

import IGSNLogo from '../../../assets/images/logos/IGSN_Logo_200.jpg';
import sampleStyles from '../samples.styles';

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
