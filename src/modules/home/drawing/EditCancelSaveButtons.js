import React from 'react';
import {View} from 'react-native';

import ActionButton from '../../../shared/ui/buttons/ActionButton';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import {HOME_ACTIONS} from '../home.constants';

const EditCancelSaveButtons = ({handleHomeAction}) => {
  return (
    <>
      <View style={{marginBottom: -10}}>
        <ActionButton
          onPress={() => handleHomeAction(HOME_ACTIONS.SAVE_EDITS)}
          title={'Save Edits'}
        />
      </View>
      <OutlineButton
        onPress={() => handleHomeAction(HOME_ACTIONS.CANCEL_EDITS)}
        title={'Cancel'}
      />
    </>
  );
};

export default EditCancelSaveButtons;
