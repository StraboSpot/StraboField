import React from 'react';
import {Pressable} from 'react-native';

import {Image} from '@rn-vui/base';

import igsnStyles from './igsn.styles';
import IGSNLogoSource from '../../../assets/images/logos/IGSN_Logo_200.jpg';

const IGSNLogo = ({onIGSNButtonPressed}) => {
  return (
    <Pressable onPress={onIGSNButtonPressed} pressRetentionOffset={{top: 2, left: 2, right: 2, bottom: 2}}>
      <Image source={IGSNLogoSource} style={igsnStyles.IGSNLogo}/>
    </Pressable>
  );
};

export default IGSNLogo;
