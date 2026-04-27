import React from 'react';
import {Pressable, Text, View} from 'react-native';

import commonStyles from '../common.styles';

const ListEmptyText = ({text, textStyle, containerStyle, onPress}) => {
  const content = (
    <View style={containerStyle}>
      <Text style={[commonStyles.noValueText, textStyle]}>{text}</Text>
    </View>
  );

  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
};

export default ListEmptyText;
