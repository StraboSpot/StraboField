import React from 'react';
import {View} from 'react-native';

import ActionButton from '../../../shared/ui/buttons/ActionButton';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';

const EditCancelSaveButtons = ({clickHandler}) => {
  return (
    <>
      <View style={{marginBottom: -10}}>
        <ActionButton
          onPress={() => clickHandler('saveEdits')}
          title={'Save Edits'}
        />
      </View>
      <OutlineButton
        onPress={() => clickHandler('cancelEdits')}
        title={'Cancel'}
      />
    </>
  );
};

export default EditCancelSaveButtons;
