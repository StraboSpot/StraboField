import React, {useState} from 'react';
import {Pressable} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';

import useAutoBackup from '../../../services/files/useAutoBackup';

const AutoBackupButton = () => {
  /* Data Hooks */

  const {performSnapshot} = useAutoBackup();
  const toast = useToast();

  /* Local State */

  const [isBacking, setIsBacking] = useState(false);

  /* Event Handlers */

  const onPress = async () => {
    if (isBacking) return;
    setIsBacking(true);
    try {
      await performSnapshot();
      toast.show('Snapshot saved.', {type: 'success', duration: 1500});
    }
    catch {
      toast.show('Snapshot failed.', {type: 'danger', duration: 2000});
    }
    finally {
      setIsBacking(false);
    }
  };

  /* View */

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => ({
        alignItems: 'center',
        backgroundColor: pressed || isBacking ? '#d0d0d0' : '#ffffff',
        borderRadius: 14,
        elevation: 3,
        height: 50,
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: '#000000',
        shadowOffset: {height: 2, width: 0},
        shadowOpacity: 0.2,
        shadowRadius: 3,
        width: 50,
      })}
    >
      <Icon
        color={isBacking ? 'dodgerblue' : '#000000'}
        name={isBacking ? 'save' : 'save-outline'}
        size={28}
        type={'ionicon'}
      />
    </Pressable>
  );
};

export default AutoBackupButton;
