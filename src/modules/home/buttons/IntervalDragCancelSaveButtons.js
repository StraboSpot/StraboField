import React from 'react';
import {View} from 'react-native';

import ActionButton from '../../../shared/ui/buttons/ActionButton';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';

const IntervalDragCancelSaveButtons = ({clickHandler}) => {
  return (
    <>
      <View style={{marginBottom: -10}}>
        <ActionButton
          onPress={() => clickHandler('saveReordering')}
          title={'Save Reordering'}
        />
      </View>
      <OutlineButton
        onPress={() => clickHandler('cancelIntervalDrag')}
        title={'Cancel'}
      />
    </>
  );
};

export default IntervalDragCancelSaveButtons;
