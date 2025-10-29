import React from 'react';
import {View} from 'react-native';

import {BallIndicator} from 'react-native-indicators';

import uiStyles from './ui.styles';

const Loading = ({color, count, isLoading, size, style}) => {

  if (isLoading) {
    return (
      <View style={[uiStyles.backdrop, style]}>
        <BallIndicator
          color={color || 'darkgrey'}
          count={count || 8}
          size={size || 40}
        />
      </View>
    );
  }
};

export default Loading;
