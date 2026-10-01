import React from 'react';
import {Text, View} from 'react-native';

import {BallIndicator} from 'react-native-indicators';

import uiStyles from './ui.styles';

const Loading = ({color, count, isLoading, size, style, text}) => {

  if (isLoading) {
    return (
      <View style={[uiStyles.backdrop, !!text && uiStyles.loadingWithText, style]}>
        <BallIndicator
          color={color || 'darkgrey'}
          count={count || 8}
          size={size || 40}
          // The indicator fills the backdrop by default, which would push the text to its bottom edge
          style={!!text && {flex: 0}}
        />
        {!!text && <Text style={uiStyles.loadingText}>{text}</Text>}
      </View>
    );
  }
};

export default Loading;
