import React from 'react';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch} from 'react-redux';

import alert from '../../shared/ui/alert';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import {resetHiddenWarnings} from '../home/home.slice';

const ResetWarnings = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const toast = useToast();

  /* Event Handlers */

  const handleResetPressed = () => {
    alert(
      'Reset Warnings',
      'Turn all warning pop-ups back on?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          onPress: () => {
            dispatch(resetHiddenWarnings());
            toast.show('All warnings reset', {type: 'success'});
          },
        },
      ],
    );
  };

  /* View */

  return (
    <OutlineButton
      onPress={handleResetPressed}
      title={'Reset All Warnings'}
    />
  );
};

export default ResetWarnings;
