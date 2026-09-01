import React, {useState} from 'react';
import {Platform, View} from 'react-native';

import {useSelector} from 'react-redux';

import BackupTagsModal from './BackupTagsModal';
import LoadTagsModal from './LoadTagsModal';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import ClearButton from '../../shared/ui/buttons/ClearButton';

const BackupLoadTags = ({isGeologicUnits}) => {
  /* Data Hooks */

  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);

  /* Local State */

  const [backupTagsModalVisible, setBackupTagsModalVisible] = useState(false);
  const [loadTagsModalVisible, setLoadTagsModalVisible] = useState(false);

  /* Event Handlers */

  const handleClosePress = () => {
    setLoadTagsModalVisible(false);
    setBackupTagsModalVisible(false);
  };

  /* View */

  return (
    <>
      <View style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
        {!isReadOnlyProject && (
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
        )}
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

      {/* Modals */}
      {backupTagsModalVisible && <BackupTagsModal closeModal={handleClosePress} isGeologicUnits={isGeologicUnits}/>}
      {loadTagsModalVisible && <LoadTagsModal closeModal={handleClosePress} isGeologicUnits={isGeologicUnits}/>}
    </>
  );
};

export default BackupLoadTags;
