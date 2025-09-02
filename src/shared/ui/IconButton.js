import React from 'react';
import {Pressable} from 'react-native';

import {Image} from '@rn-vui/base';

import uiStyles from '../ui/ui.styles';

const IconButton = ({
                      containerStyle,
                      imageStyle,
                      onLongPress,
                      onPress,
                      source,
                      style,
                    }) => {

  return (
    <Pressable
      delayLongPress={1000}
      onLongPress={onLongPress}
      onPress={onPress}
      style={style}
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
