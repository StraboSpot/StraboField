import React from 'react';
import {FlatList, Platform} from 'react-native';

const FormFlatList = ({children, ...rest}) => {

  return (
    <FlatList
      ListHeaderComponent={<>{children}</>}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      data={[]}
      keyboardShouldPersistTaps='handled'
      {...rest}
    />
  );
};

export default FormFlatList;
