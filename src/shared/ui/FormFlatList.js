import React, {useCallback} from 'react';
import {FlatList, Platform} from 'react-native';

const FormFlatList = ({children, ...rest}) => {
  const renderHeader = useCallback(() => <>{children}</>, [children]);

  return (
    <FlatList
      ListHeaderComponent={renderHeader}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      data={[]}
      keyboardShouldPersistTaps='handled'
      {...rest}
    />
  );
};

export default FormFlatList;
