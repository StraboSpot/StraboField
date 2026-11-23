import React from 'react';
import {Pressable} from 'react-native';

import {Image} from '@rn-vui/base';

import uiStyles from '../ui.styles';

const IconButton = ({
                      containerStyle,
                      imageStyle,
                      onLongPress,
                      onPress,
                      source,
                      style,
                      testID,
                    }) => {

  return (
    <Pressable
      delayLongPress={1000}
      onLongPress={onLongPress}
      onPress={onPress}
      style={style}
      testID={testID}
    >
      <Image
        containerStyle={containerStyle}
        source={source}
        style={[uiStyles.imageIcon, imageStyle]}
      />
    </Pressable>
  );
};

export default IconButton;
