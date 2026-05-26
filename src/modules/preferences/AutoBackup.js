import React, {useState} from 'react';
import {Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import styles from './preferences.styles';
import commonStyles from '../../shared/common.styles';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {setAutoBackupFrequency} from '../home/home.slice';

const FREQUENCY_OPTIONS = [
  {label: 'Off', value: 0},
  {label: 'Every 15 Minutes', value: 900000},
  {label: 'Every 30 Minutes', value: 1800000},
  {label: 'Every 1 Hour', value: 3600000},
  {label: 'Every 2 Hours', value: 7200000},
];

const getFrequencyLabel = (value) => {
  const match = FREQUENCY_OPTIONS.find(opt => opt.value === value);
  return match ? match.label : 'Off';
};

const AutoBackup = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const autoBackupFrequency = useSelector(state => state.home.autoBackupFrequency);

  /* Local State */

  const [isModalVisible, setIsModalVisible] = useState(false);

  /* Event Handlers */

  const onSelectFrequency = (value) => {
    dispatch(setAutoBackupFrequency(value));
    setIsModalVisible(false);
  };

  /* Render Functions */

  const renderFrequencyList = () => (
    <>
      {FREQUENCY_OPTIONS.map((option, index) => (
        <View key={option.value}>
          <ListItem
            containerStyle={[commonStyles.listItem, {backgroundColor: option.value === autoBackupFrequency ? '#e8f0fe' : undefined}]}
            onPress={() => onSelectFrequency(option.value)}
          >
            <ListItem.Content>
              <ListItem.Title style={commonStyles.listItemTitle}>{option.label}</ListItem.Title>
            </ListItem.Content>
            {option.value === autoBackupFrequency && (
              <ListItem.Chevron name={'checkmark'} type={'ionicon'}/>
            )}
          </ListItem>
          {index < FREQUENCY_OPTIONS.length - 1 && <FlatListItemSeparator/>}
        </View>
      ))}
    </>
  );

  /* View */

  return (
    <>
      <OutlineButton
        onPress={() => setIsModalVisible(true)}
        title={`Auto Backup (${getFrequencyLabel(autoBackupFrequency)})`}
      />
      <ModalWrapper
        closeModal={() => setIsModalVisible(false)}
        headerTitle={'Auto Backup Frequency'}
        isVisible={isModalVisible}
        overlayStyleOverride={{width: 350, height: 'auto'}}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <View style={styles.inputContainer}>
          <Text style={[commonStyles.importantText, {textAlign: 'center', paddingBottom: 10}]}>
            Automatically saves project metadata to the ProjectBackups folder. A rolling history of up to 20 snapshots
            is kept.
          </Text>
          {renderFrequencyList()}
        </View>
      </ModalWrapper>
    </>
  );
};

export default AutoBackup;
