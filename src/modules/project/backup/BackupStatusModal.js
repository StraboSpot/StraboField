import React, {useRef} from 'react';
import {Platform, Text, View} from 'react-native';

import {Button, Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import AutoSaveCountdown from './AutoSaveCountdown';
import AutoSyncCountdown from './AutoSyncCountdown';
import {BACKUP_ICON_NAMES, ICON_TYPE} from './backup.constants';
import commonStyles from '../../../shared/common.styles';
import {PRIMARY_ACCENT_COLOR, SMALL_TEXT_SIZE, WARNING_COLOR} from '../../../shared/styles.constants';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../../shared/ui/SectionDivider';
import {
  setManualSyncRequested,
  setNextAutoSaveTime,
  setNextAutoSyncTime,
} from '../../connections/connections.slice';
import {setIsSyncConflictModalVisible} from '../../home/home.slice';

const BackupStatusModal = ({isVisible, onClose}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const conflictedDatasetIds = useSelector(state => state.connections.conflictedDatasetIds);
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

  /* Derived Variables */

  const isImagesPending = isPendingImagesChanges || isTransferringImages;
  const isUploadPending = isProjectSyncNeeded || pendingUploadDatasetIds.length > 0;
  const isSyncPending = isUploadPending || isImagesPending;
  // Uploads and downloads save first even with auto save off, so a running save counts too
  const isSavePending = isAutoSaving || isLocalSaveNeeded;
  const isImagesOnlyPending = isImagesPending && !isUploadPending && !isAutoSyncing;
  const isConflictPending = conflictedDatasetIds.length > 0;
  const pendingDatasetNames = pendingUploadDatasetIds.map(id => datasets[id]?.name).filter(Boolean);
  const conflictedDatasetNames = conflictedDatasetIds.map(id => datasets[id]?.name).filter(Boolean);
  const projectName = project?.description?.project_name || 'Current Project';

  /* Local State */

  const isConflictModalPending = useRef(false);

  /* Event Handlers */

  const handleSyncNow = () => {
    dispatch(setManualSyncRequested(true));
    dispatch(setNextAutoSyncTime(Date.now()));
  };

  const handleResolveConflicts = () => {
    // iOS can't present a native Modal while this one is dismissing, so defer to onDismiss.
    if (Platform.OS === 'ios') isConflictModalPending.current = true;
    else dispatch(setIsSyncConflictModalVisible(true));
    onClose();
  };

  const handleDismiss = () => {
    if (isConflictModalPending.current) {
      isConflictModalPending.current = false;
      dispatch(setIsSyncConflictModalVisible(true));
    }
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={onClose}
      headerTitle={'Auto Backup Status'}
      isVisible={isVisible}
      onBackdropPress={onClose}
      onDismiss={handleDismiss}
      overlayStyleOverride={{height: 'auto'}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton
    >
      {/* Both sections always show, saying when auto save or auto sync is off or has nothing to do */}
      <View>
        <SectionDivider
          dividerText={isAutoSaving ? 'Saving to Device…'
            : isLocalSaveNeeded ? 'Pending Device Save'
              : 'No Changes to Save'}
          leftIcon={<Icon name={BACKUP_ICON_NAMES.SAVE} size={18} type={ICON_TYPE}/>}
          subtitle={'All datasets · Excludes images & offline maps'}
        />
        <View style={{alignItems: 'center', flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5}}>
          <Icon color={PRIMARY_ACCENT_COLOR} name={BACKUP_ICON_NAMES.CLOCK} size={20} type={ICON_TYPE}/>
          <View style={{flex: 1, paddingLeft: 6}}>
            <AutoSaveCountdown/>
          </View>
          {/* Works with auto save off too: the auto save timer runs a time set for now, then schedules nothing */}
          {!isAutoSaving && isLocalSaveNeeded && (
            <Button
              buttonStyle={{borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6}}
              onPress={() => dispatch(setNextAutoSaveTime(Date.now()))}
              title={'Save Now'}
              titleStyle={{color: PRIMARY_ACCENT_COLOR, fontSize: SMALL_TEXT_SIZE}}
              type={'outline'}
            />
          )}
        </View>
        {isSavePending ? (
          <>
            <Text style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
              {'Project: ' + projectName}
            </Text>
            <Text style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
              {'Datasets: All will be saved'}
            </Text>
          </>
        ) : (
          <Text style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
            {'No changes since the last save'}
          </Text>
        )}
      </View>
      <View>
        <SectionDivider
          dividerText={isAutoSyncing ? 'Syncing with Server…'
            : isImagesOnlyPending ? 'Pending Image Upload'
              : 'Pending Server Sync'}
          leftIcon={(
            <Icon
              name={isImagesOnlyPending ? BACKUP_ICON_NAMES.IMAGE : BACKUP_ICON_NAMES.SYNC}
              size={18}
              type={ICON_TYPE}
            />
          )}
          subtitle={isImagesOnlyPending ? 'Images only'
            : isSyncPending ? 'Changed datasets only' : 'No local changes · Will check server for updates'}
        />
        <View style={{alignItems: 'center', flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5}}>
          <Icon color={PRIMARY_ACCENT_COLOR} name={BACKUP_ICON_NAMES.CLOCK} size={20} type={ICON_TYPE}/>
          <View style={{flex: 1, paddingLeft: 6}}>
            <AutoSyncCountdown/>
          </View>
          {!isAutoSyncing && isOnline && (
            <Button
              buttonStyle={{borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6}}
              onPress={handleSyncNow}
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
        {isSyncPending ? (
          <Text style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
            {'Images: ' + (isImagesPending ? 'Pending upload' + (isWifiOnlyForImages ? ' (Wi-Fi only)' : '')
              : 'None pending upload')}
          </Text>
        ) : (
          <Text style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
            {'No local changes to upload'}
          </Text>
        )}
      </View>
      {isConflictPending && (
        <View>
          <SectionDivider
            dividerText={'Sync Conflicts'}
            leftIcon={<Icon color={WARNING_COLOR} name={BACKUP_ICON_NAMES.CONFLICT} size={18} type={ICON_TYPE}/>}
            subtitle={'Changed on this device and the server'}
          />
          {conflictedDatasetNames.map(name => (
            <Text key={name} style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 8}]}>
              {'Dataset: ' + name}
            </Text>
          ))}
          <View style={{alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8}}>
            <Button
              buttonStyle={{borderColor: WARNING_COLOR, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6}}
              onPress={handleResolveConflicts}
              title={'Resolve Conflicts'}
              titleStyle={{color: WARNING_COLOR, fontSize: SMALL_TEXT_SIZE}}
              type={'outline'}
            />
          </View>
        </View>
      )}
      <Text style={[commonStyles.noValueText, {fontSize: SMALL_TEXT_SIZE, paddingHorizontal: 10, paddingTop: 10}]}>
        {'Auto-saves are stored locally on this device and are not uploaded to the server.'}
      </Text>
    </ModalWrapper>
  );
};

export default BackupStatusModal;
