import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, TouchableOpacity, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import BackupStatusModal from './BackupStatusModal';
import statusBarStyles from './statusBar.styles';
import * as themes from '../../shared/styles.constants';

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

  /* Derived Variables */

  const isUploadPending = isProjectDirty || pendingUploadDatasetIds.length > 0;
  const isSaveVisible = isLocalSaveNeeded || isAutoSaving;
  const isUploadVisible = isUploadPending || isAutoUploading;

  const saveBounce = useBounceAnimation(isAutoSaving);
  const uploadBounce = useBounceAnimation(isAutoUploading);

  /* Local State */

  const [isModalVisible, setIsModalVisible] = useState(false);

  /* View */

  if (!isSaveVisible && !isUploadVisible) return null;

  return (
    <>
      <BackupStatusModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)}/>
      <TouchableOpacity onPress={() => setIsModalVisible(true)}>
        <View style={statusBarStyles.backupStatusContainer}>
          {isSaveVisible && (
            <Animated.View style={{transform: [{translateY: saveBounce}]}}>
              <Icon
                color={themes.PRIMARY_ACCENT_COLOR}
                name={'content-save-alert'}
                size={24}
                type={'material-community'}
              />
            </Animated.View>
          )}
          {isUploadVisible && (
            <Animated.View style={{transform: [{translateY: uploadBounce}]}}>
              <Icon
                color={themes.PRIMARY_ACCENT_COLOR}
                name={'cloud-upload-outline'}
                size={24}
                type={'material-community'}
              />
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
    </>
  );
};

export default BackupStatusIcons;
