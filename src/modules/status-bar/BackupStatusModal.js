import React from 'react';
import {Text, View} from 'react-native';

import {Button, Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {BACKUP_ICON_NAMES, ICON_TYPE} from './statusBarIcon.constants';
import {setNextAutoSaveTime, setNextAutoSyncTime} from '../../modules/connections/connections.slice';
import commonStyles from '../../shared/common.styles';
import {PRIMARY_ACCENT_COLOR, SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../shared/ui/SectionDivider';
import AutoSaveCountdown from '../project/backup/AutoSaveCountdown';
import AutoSyncCountdown from '../project/backup/AutoSyncCountdown';

const BackupStatusModal = ({isVisible, onClose}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const datasets = useSelector(state => state.project.datasets);
  const isAutoSaving = useSelector(state => state.connections.isAutoSaving);
  const isAutoSyncing = useSelector(state => state.connections.isAutoSyncing);
  const isLocalSaveNeeded = useSelector(state => state.connections.isLocalSaveNeeded);
  const isOnline = useSelector(state => state.connections.isOnline?.isConnected);
  const isPendingImagesChanges = useSelector(state => state.connections.isPendingImagesChanges);
  const isProjectSyncNeeded = useSelector(state => state.connections.isProjectSyncNeeded);
  const isTransferringImages = useSelector(state => state.connections.isTransferringImages);
  const isWifiOnlyForImages = useSelector(state => state.connections.isWifiOnlyForImages);
  const pendingUploadDatasetIds = useSelector(state => state.connections.pendingUploadDatasetIds);
  const project = useSelector(state => state.project.project);
  const saveFrequency = useSelector(state => state.connections.backupFrequency?.save);
  const syncFrequency = useSelector(state => state.connections.backupFrequency?.sync);

  /* Derived Variables */

  const isImagesPending = isPendingImagesChanges || isTransferringImages;
  const isUploadPending = isProjectSyncNeeded || pendingUploadDatasetIds.length > 0;
  const isSaveVisible = !!saveFrequency && (isLocalSaveNeeded || isAutoSaving);
  const isSyncVisible = !!syncFrequency
    && (isUploadPending || isAutoSyncing || isImagesPending);
  // When images are the only thing left to sync, show the images icon instead of the upload icon.
  const isImagesOnlyPending = isImagesPending && !isUploadPending && !isAutoSyncing;
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
            leftIcon={<Icon name={BACKUP_ICON_NAMES.SAVE} size={18} type={ICON_TYPE}/>}
            subtitle={'All datasets · Excludes images & offline maps'}
          />
          <View style={{alignItems: 'center', flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5}}>
            <Icon color={PRIMARY_ACCENT_COLOR} name={BACKUP_ICON_NAMES.CLOCK} size={20} type={ICON_TYPE}/>
            <View style={{flex: 1, paddingLeft: 6}}>
              <AutoSaveCountdown/>
            </View>
            {!isAutoSaving && !!saveFrequency && (
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
          <Text style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
            {'Datasets: All will be saved'}
          </Text>
        </View>
      )}
      {isSyncVisible && (
        <View>
          <SectionDivider
            dividerText={isImagesOnlyPending ? 'Pending Image Upload'
              : (isAutoSyncing ? 'Syncing with Server…' : 'Pending Server Sync')}
            leftIcon={(
              <Icon
                name={isImagesOnlyPending ? BACKUP_ICON_NAMES.IMAGE : BACKUP_ICON_NAMES.SYNC}
                size={18}
                type={ICON_TYPE}
              />
            )}
            subtitle={isImagesOnlyPending ? 'Images only' : 'Changed datasets only'}
          />
          <View style={{alignItems: 'center', flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5}}>
            <Icon color={PRIMARY_ACCENT_COLOR} name={BACKUP_ICON_NAMES.CLOCK} size={20} type={ICON_TYPE}/>
            <View style={{flex: 1, paddingLeft: 6}}>
              <AutoSyncCountdown/>
            </View>
            {!isAutoSyncing && isOnline && !!syncFrequency && (
              <Button
                buttonStyle={{borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6}}
                onPress={() => dispatch(setNextAutoSyncTime(Date.now()))}
                title={'Sync Now'}
                titleStyle={{color: PRIMARY_ACCENT_COLOR, fontSize: SMALL_TEXT_SIZE}}
                type={'outline'}
              />
            )}
          </View>
          {isUploadPending && (
            <Text style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
              {'Project: ' + projectName}
            </Text>
          )}
          {pendingDatasetNames.map(name => (
            <Text key={name} style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
              {'Dataset: ' + name}
            </Text>
          ))}
          <Text style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
            {'Images: ' + (isImagesPending ? 'Pending upload' + (isWifiOnlyForImages ? ' (Wi-Fi only)' : '')
              : 'None pending upload')}
          </Text>
        </View>
      )}
      {!isSaveVisible && !isSyncVisible && (
        <Text style={commonStyles.noValueText}>No pending auto backups.</Text>
      )}
    </ModalWrapper>
  );
};

export default BackupStatusModal;
