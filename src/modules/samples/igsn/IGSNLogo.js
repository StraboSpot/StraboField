import React from 'react';
import {View} from 'react-native';

import {Image} from '@rn-vui/base';

import sampleStyles from '../samples.styles';

const IGSNLogo = ({item}) => {
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

export default IGSNLogo;
