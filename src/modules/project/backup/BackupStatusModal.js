import React from 'react';
import {Text, View} from 'react-native';

import {Button, Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import AutoSaveCountdown from './AutoSaveCountdown';
import {BACKUP_ICON_NAMES, ICON_TYPE} from './backup.constants';
import commonStyles from '../../../shared/common.styles';
import {PRIMARY_ACCENT_COLOR, SMALL_TEXT_SIZE} from '../../../shared/styles.constants';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../../shared/ui/SectionDivider';
import {setNextAutoSaveTime} from '../../connections/connections.slice';

const BackupStatusModal = ({isVisible, onClose}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isAutoSaving = useSelector(state => state.connections.isAutoSaving);
  const isLocalSaveNeeded = useSelector(state => state.connections.isLocalSaveNeeded);
  const project = useSelector(state => state.project.project);
  const saveFrequency = useSelector(state => state.connections.backupFrequency?.save);

  /* Derived Variables */

  const isSaveVisible = !!saveFrequency && (isLocalSaveNeeded || isAutoSaving);
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
      {!isSaveVisible && (
        <Text style={commonStyles.noValueText}>No pending auto backups.</Text>
      )}
    </ModalWrapper>
  );
};

export default BackupStatusModal;
