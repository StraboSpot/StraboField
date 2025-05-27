import React from 'react';
import {Text, View} from 'react-native';

import commonStyles from '../common.styles';

const ListEmptyText = ({text, textStyle, containerStyle}) => {
  return (
    <View style={containerStyle}>
      <Text style={[commonStyles.noValueText, textStyle]}>{text}</Text>
    </View>
  );
};

export default ListEmptyText;
