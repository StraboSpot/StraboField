import React, {useState} from 'react';
import {Platform, View} from 'react-native';

import BackupTagsModal from './BackupTagsModal';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import ClearButton from '../../shared/ui/buttons/ClearButton';

const BackupTags = ({isGeologicUnits}) => {

  const [loadTagsModalVisible, setLoadTagsModalVisible] = useState(false);
  const [backupTagsModalVisible, setBackupTagsModalVisible] = useState(false);

  const action = loadTagsModalVisible ? 'load' : 'backup';

  const handleClosePress = () => {
    setLoadTagsModalVisible(false);
    setBackupTagsModalVisible(false);
  };

  return (
    <>
      <View style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
        <ClearButton
          icon={{
            color: PRIMARY_ACCENT_COLOR,
            iconStyle: {paddingRight: 10},
            name: 'download-outline',
            size: 20,
            type: 'ionicon',
          }}
          onPress={() => setLoadTagsModalVisible(true)}
          title={Platform.OS === 'iOS' ? 'Load' : 'Import'}
        />
        <ClearButton
          icon={{
            color: PRIMARY_ACCENT_COLOR,
            iconStyle: {paddingRight: 10},
            name: 'share-outline',
            size: 20,
            type: 'ionicon',
          }}
          onPress={() => setBackupTagsModalVisible(true)}
          title={Platform.OS === 'iOS' ? 'Backup' : 'Export'}
        />
      </View>

      {/* Modal */}
      {(loadTagsModalVisible || backupTagsModalVisible) && (
        <BackupTagsModal action={action} closeModal={handleClosePress} isGeologicUnits={isGeologicUnits}/>
      )}
    </>
  );
};

export default BackupTags;
