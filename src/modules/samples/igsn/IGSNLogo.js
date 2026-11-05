import React from 'react';
import {Pressable, Text} from 'react-native';

import {Image} from '@rn-vui/base';

import igsnStyles from './igsn.styles';
import IGSNLogoSource from '../../../assets/images/logos/IGSN_Logo_200.jpg';

const IGSNLogo = ({hasIGSN, onIGSNButtonPressed}) => {
  return (
    <Pressable
      onPress={onIGSNButtonPressed}
      pressRetentionOffset={{top: 2, left: 2, right: 2, bottom: 2}}
      style={!hasIGSN && igsnStyles.getIGSNButton}
    >
      {hasIGSN ? <Image source={IGSNLogoSource} style={igsnStyles.IGSNLogo}/>
        : <Text style={igsnStyles.getIGSNText}>Get{'\n'}IGSN</Text>}
    </Pressable>
  );
};

export default IGSNLogo;
