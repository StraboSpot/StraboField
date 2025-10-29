import React from 'react';
import {ActivityIndicator, View} from 'react-native';

import {Icon} from '@rn-vui/base';

const LottieAnimation = ({show, error}) => {

  return (
    <View style={{justifyContent: 'center', alignItems: 'center', marginTop: 30}}>
      {show ? <ActivityIndicator size={75}/>
        : !error ? (
          <Icon
            color={'#517fa4'}
            name={'check-circle-outline'}
            reverse
            size={35}
            type={'material-community'}
          />
        ) : (
          <Icon
            color={'#930808'}
            name={'alert-circle-outline'}
            reverse
            size={35}
            type={'material-community'}
          />
        )
      }
    </View>
  );
};

export default LottieAnimation;
