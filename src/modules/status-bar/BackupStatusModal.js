import React from 'react';
import {Text, View} from 'react-native';

import {Button, Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {BACKUP_ICON_NAMES, BACKUP_ICON_TYPE} from './backupStatus.constants';
import {setNextAutoSaveTime, setNextAutoUploadTime} from '../../modules/connections/connections.slice';
import commonStyles from '../../shared/common.styles';
import {PRIMARY_ACCENT_COLOR, SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../shared/ui/SectionDivider';
import AutoSaveCountdown from '../project/backup/AutoSaveCountdown';
import AutoUploadCountdown from '../project/backup/AutoUploadCountdown';

const BackupStatusModal = ({isVisible, onClose}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const datasets = useSelector(state => state.project.datasets);
  const isAutoSaving = useSelector(state => state.connections.isAutoSaving);
  const isAutoUploading = useSelector(state => state.connections.isAutoUploading);
  const isLocalSaveNeeded = useSelector(state => state.connections.isLocalSaveNeeded);
  const isOnline = useSelector(state => state.connections.isOnline?.isConnected);
  const isProjectDirty = useSelector(state => state.connections.isProjectDirty);
  const pendingUploadDatasetIds = useSelector(state => state.connections.pendingUploadDatasetIds);
  const project = useSelector(state => state.project.project);

  /* Derived Variables */

  const isSaveVisible = isLocalSaveNeeded || isAutoSaving;
  const isUploadVisible = isProjectDirty || pendingUploadDatasetIds.length > 0 || isAutoUploading;
  const pendingDatasetNames = pendingUploadDatasetIds.map(id => datasets[id]?.name).filter(Boolean);
  const projectName = project?.description?.project_name || 'Current Project';

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
            leftIcon={<Icon name={BACKUP_ICON_NAMES.SAVE} size={18} type={BACKUP_ICON_TYPE}/>}
            subtitle={'All datasets · Excludes images & offline maps'}
          />
          <View style={{alignItems: 'center', flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5}}>
            <Icon color={PRIMARY_ACCENT_COLOR} name={BACKUP_ICON_NAMES.CLOCK} size={20} type={BACKUP_ICON_TYPE}/>
            <View style={{flex: 1, paddingLeft: 6}}>
              <AutoSaveCountdown/>
            </View>
            {!isAutoSaving && (
              <Button
                buttonStyle={{borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6}}
                onPress={() => dispatch(setNextAutoSaveTime(Date.now()))}
                title={'Save Now'}
                titleStyle={{color: PRIMARY_ACCENT_COLOR, fontSize: SMALL_TEXT_SIZE}}
                type={'outline'}
              />
            )}
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
            leftIcon={<Icon name={BACKUP_ICON_NAMES.UPLOAD} size={18} type={BACKUP_ICON_TYPE}/>}
            subtitle={'Changed datasets only'}
          />
          <View style={{alignItems: 'center', flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5}}>
            <Icon color={PRIMARY_ACCENT_COLOR} name={BACKUP_ICON_NAMES.CLOCK} size={20} type={BACKUP_ICON_TYPE}/>
            <View style={{flex: 1, paddingLeft: 6}}>
              <AutoUploadCountdown/>
            </View>
            {!isAutoUploading && isOnline && (
              <Button
                buttonStyle={{borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6}}
                onPress={() => dispatch(setNextAutoUploadTime(Date.now()))}
                title={'Upload Now'}
                titleStyle={{color: PRIMARY_ACCENT_COLOR, fontSize: SMALL_TEXT_SIZE}}
                type={'outline'}
              />
            )}
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
        <Text style={commonStyles.noValueText}>No pending auto backups.</Text>
      )}
    </ModalWrapper>
  );
};

export default BackupStatusModal;
