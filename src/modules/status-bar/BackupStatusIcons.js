import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, TouchableOpacity, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import BackupStatusModal from './BackupStatusModal';
import statusBarStyles from './statusBar.styles';
import {BACKUP_ICON_NAMES, ICON_TYPE} from './statusBarIcon.constants';
import * as themes from '../../shared/styles.constants';
import homeStyles from '../home/home.style';

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
      bounceValue.setValue(0);
    }
  }, [isActive]);

  return bounceValue;
};

const BackupStatusIcons = () => {
  /* Data Hooks */

  const isAutoSaving = useSelector(state => state.connections.isAutoSaving);
  const isAutoUploading = useSelector(state => state.connections.isAutoUploading);
  const isLocalSaveNeeded = useSelector(state => state.connections.isLocalSaveNeeded);
  const isProjectDirty = useSelector(state => state.connections.isProjectDirty);
  const pendingUploadDatasetIds = useSelector(state => state.connections.pendingUploadDatasetIds);

  const saveBounce = useBounceAnimation(isAutoSaving);
  const uploadBounce = useBounceAnimation(isAutoUploading);

  /* Local State */

  const [isModalVisible, setIsModalVisible] = useState(false);

  /* Derived Variables */

  const isSaveVisible = isLocalSaveNeeded || isAutoSaving;
  const isUploadPending = isProjectDirty || pendingUploadDatasetIds.length > 0;
  const isUploadVisible = isUploadPending || isAutoUploading;

  /* View */

  if (!isSaveVisible && !isUploadVisible && !isModalVisible) return null;

  return (
    <>
      <BackupStatusModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)}/>
      <TouchableOpacity onPress={() => setIsModalVisible(true)}>
        <View style={statusBarStyles.backupStatusContainer}>
          {isSaveVisible && (
            <Animated.View style={[
              statusBarStyles.saveAlertIconContainer,
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
          {isUploadVisible && (
            <Animated.View style={[
              statusBarStyles.saveAlertIconContainer,
              {transform: [{translateY: uploadBounce}]}]}>
              <Icon
                color={themes.PRIMARY_ACCENT_COLOR}
                name={BACKUP_ICON_NAMES.UPLOAD}
                size={24}
                type={ICON_TYPE}
              />
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
      {(isSaveVisible || isUploadVisible) && <View style={homeStyles.statusBarDivider}/>}
    </>
  );
};

export default BackupStatusIcons;
