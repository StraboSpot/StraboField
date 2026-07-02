import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, TouchableOpacity, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {BACKUP_ICON_NAMES, ICON_TYPE} from './backup.constants';
import backupStatusStyles from './backupStatus.styles';
import BackupStatusModal from './BackupStatusModal';
import SyncConflictModal from './SyncConflictModal';
import * as themes from '../../../shared/styles.constants';
import homeStyles from '../../home/home.style';

const useBounceAnimation = (isActive) => {
  const bounceValue = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceValue, {
            duration: 300,
            easing: Easing.out(Easing.quad),
            toValue: -5,
            useNativeDriver: true,
          }),
          Animated.timing(bounceValue, {
            duration: 300,
            easing: Easing.in(Easing.quad),
            toValue: 0,
            useNativeDriver: true,
          }),
        ]),
      );
      animationRef.current.start();
    }
    else {
      animationRef.current?.stop();
      animationRef.current = null;
      // stopAnimation's callback fires after the native stop settles, so resetting to 0 here
      // avoids a residual offset that would leave the icon stuck slightly elevated.
      bounceValue.stopAnimation(() => bounceValue.setValue(0));
    }
  }, [isActive]);

  return bounceValue;
};

const BackupStatusIcons = () => {
  /* Data Hooks */

  const isAutoSaving = useSelector(state => state.connections.isAutoSaving);
  const isLocalSaveNeeded = useSelector(state => state.connections.isLocalSaveNeeded);
  const isPendingImagesChanges = useSelector(state => state.connections.isPendingImagesChanges);
  const isProjectSyncNeeded = useSelector(state => state.connections.isProjectSyncNeeded);
  const isTransferringImages = useSelector(state => state.connections.isTransferringImages);
  const pendingUploadDatasetIds = useSelector(state => state.connections.pendingUploadDatasetIds);
  const saveFrequency = useSelector(state => state.connections.backupFrequency?.save);

  const saveBounce = useBounceAnimation(isAutoSaving);

  /* Local State */

  const [isModalVisible, setIsModalVisible] = useState(false);

  /* Derived Variables */

  const isSaveVisible = !!saveFrequency && (isLocalSaveNeeded || isAutoSaving);
  const isUploadPending = isProjectSyncNeeded || pendingUploadDatasetIds.length > 0;
  const isImagesActive = isPendingImagesChanges || isTransferringImages;
  const isSyncVisible = !!syncFrequency && (isUploadPending || isAutoSyncing);
  // A distinct icon for when images are the only thing left to sync - if project/dataset
  // changes are pending or a sync is running, the upload icon above already covers it.
  const isImagesOnlyVisible = !!syncFrequency && isImagesActive && !isUploadPending && !isAutoSyncing;
  // Conflicts persist across restart, so surface them regardless of sync frequency.
  const isConflictVisible = conflictedDatasetIds.length > 0;

  /* View */

  if (!isSaveVisible && !isModalVisible) return null;

  return (
    <>
      <BackupStatusModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)}/>
      <TouchableOpacity onPress={() => setIsModalVisible(true)}>
        <View style={backupStatusStyles.backupStatusContainer}>
          {isSaveVisible && (
            <Animated.View style={[
              backupStatusStyles.saveAlertIconContainer,
              {transform: [{translateY: saveBounce}]}]}
            >
              <Icon
                color={themes.PRIMARY_ACCENT_COLOR}
                name={BACKUP_ICON_NAMES.SAVE_ALERT}
                size={24}
                type={ICON_TYPE}
              />
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
      {isSaveVisible && <View style={homeStyles.statusBarDivider}/>}
    </>
  );
};

export default BackupStatusIcons;
