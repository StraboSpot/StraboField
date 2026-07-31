import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {Image} from '@rn-vui/base';

import igsnStyles from './igsn.styles';
import IGSNLogoSource from '../../../assets/images/logos/IGSN_Logo_200.jpg';

const IGSNLogo = ({item, onIGSNButtonPressed}) => {
  return (
    <View>
      {/*{item.isOnMySesar && (*/}
      <Pressable
        onPress={onIGSNButtonPressed}
        pressRetentionOffset={{top: 2, left: 2, right: 2, bottom: 2}}
        style={{
          borderWidth: item.isOnMySesar ? 0 : 1,
          borderColor: 'black',
          borderRadius: 7,
          padding: 2,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {item.isOnMySesar ? <Image
            source={IGSNLogoSource}
            style={{...igsnStyles.IGSNLogo}}
          />
          : (
            <View style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{fontSize: 10, textAlign: 'center'}}>Get{'\n'}IGSN</Text>
            </View>
          )
        }
      </Pressable>
      {/*)}*/}
    </View>
  );
};

export default IGSNLogo;
