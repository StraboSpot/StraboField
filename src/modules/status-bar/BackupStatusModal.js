import React from 'react';
import {Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../shared/ui/SectionDivider';
import AutoSaveCountdown from '../project/backup/AutoSaveCountdown';
import AutoUploadCountdown from '../project/backup/AutoUploadCountdown';

const BackupStatusModal = ({isVisible, onClose}) => {
  /* Data Hooks */

  const isAutoSaving = useSelector(state => state.connections.isAutoSaving);
  const isAutoUploading = useSelector(state => state.connections.isAutoUploading);
  const isLocalSaveNeeded = useSelector(state => state.connections.isLocalSaveNeeded);
  const isProjectDirty = useSelector(state => state.connections.isProjectDirty);
  const pendingUploadDatasetIds = useSelector(state => state.connections.pendingUploadDatasetIds);
  const datasets = useSelector(state => state.project.datasets);
  const project = useSelector(state => state.project.project);

  /* Derived Variables */

  const projectName = project?.description?.project_name || 'Current Project';
  const isSaveVisible = isLocalSaveNeeded || isAutoSaving;
  const isUploadVisible = isProjectDirty || pendingUploadDatasetIds.length > 0 || isAutoUploading;
  const pendingDatasetNames = pendingUploadDatasetIds.map(id => datasets[id]?.name).filter(Boolean);

  /* View */

  return (
    <ModalWrapper
      actionTitle={'OK'}
      closeModal={onClose}
      headerTitle={'Auto Backup Status'}
      isVisible={isVisible}
      onActionPressed={onClose}
      onBackdropPress={onClose}
      overlayStyleOverride={{height: 'auto'}}
      showCancelButton={false}
      showCloseButton
    >
      {isSaveVisible && (
        <View>
          <SectionDivider
            dividerText={isAutoSaving ? 'Saving to Device…' : 'Pending Device Save'}
            subtitle={'All datasets · Excludes images & offline maps'}
          />
          <View style={{paddingHorizontal: 10}}>
            <AutoSaveCountdown/>
          </View>
          <Text style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
            {'Project: ' + projectName}
          </Text>
        </View>
      )}
      {isUploadVisible && (
        <View>
          <SectionDivider
            dividerText={isAutoUploading ? 'Uploading to Server…' : 'Pending Server Upload'}
            subtitle={'Changed datasets only'}
          />
          <View style={{paddingHorizontal: 10}}>
            <AutoUploadCountdown/>
          </View>
          {isProjectDirty && (
            <Text style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
              {'Project: ' + projectName}
            </Text>
          )}
          {pendingDatasetNames.map(name => (
            <Text key={name} style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
              {'Dataset: ' + name}
            </Text>
          ))}
        </View>
      )}
      {!isSaveVisible && !isUploadVisible && (
        <Text style={commonStyles.noValueText}>Nothing pending.</Text>
      )}
    </ModalWrapper>
  );
};

export default BackupStatusModal;
