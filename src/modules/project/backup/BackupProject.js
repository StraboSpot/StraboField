import React, {useRef, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import BackupStatusModal from './BackupStatusModal';
import SaveAndExportModal from './SaveAndExportModal';
import UploadModal from './UploadModal';
import useBackupUpload from './useBackupUpload';
import useDevice from '../../../services/device/useDevice';
import {BLUE} from '../../../shared/styles.constants';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../../shared/ui/SectionDivider';
import ConnectionRequiredMessage from '../../../shared/ui/text/ConnectionRequiredMessage';
import uiStyles from '../../../shared/ui/ui.styles';
import {setBackupFrequency} from '../../connections/connections.slice';
import {FormikWrapper} from '../../form';
import SelectInputField from '../../form/SelectInputField';
import {openedMessageModal} from '../../home/home.slice';
import MainMenuPanelListItem from '../../main-menu-panel/MainMenuPanelListItem';

const BackupProject = () => {
  console.log('Rendering BackupProject...');

  const preFormRef = useRef(null);

  const FREQUENCY_OPTIONS = [0, 10, 30, 60];
  const choices = FREQUENCY_OPTIONS.map(choice => (
    {label: choice === 0 ? 'Off' : choice + ' minutes', value: choice}
  ));

  /* Data Hooks */

  const dispatch = useDispatch();
  const activeDatasets = useSelector(state => state.project.activeDatasetsIds);
  const backupFrequency = useSelector(state => state.connections.backupFrequency);

  const {openURL} = useDevice();
  const {
    closeUploadModal,
    isUploadAutoStart,
    isUploadAvailable,
    isUploadModalVisible,
    openUploadModal,
    startUploadFromStatus,
  } = useBackupUpload();

  /* Local State */

  const [backupAction, setBackupAction] = useState(undefined);
  const [isBackupStatusModalVisible, setIsBackupStatusModalVisible] = useState(false);
  const [isSaveAndExportModalVisible, setIsSaveAndExportModalVisible] = useState(false);

  /* Event Handlers */

  const onUploadFromStatus = () => startUploadFromStatus(() => setIsBackupStatusModalVisible(false));

  /* Logic Helpers */

  const checkForActiveDatasets = (backupActionToSet) => {
    if (activeDatasets.length > 0) {
      setIsSaveAndExportModalVisible(true);
      setBackupAction(backupActionToSet);
    }
    else dispatch(openedMessageModal({message: 'There are no active datasets selected.', title: 'Error!'}));
  };

  const exportProject = () => checkForActiveDatasets('export');

  const saveProject = () => checkForActiveDatasets('save');

  /* Render Functions */

  const renderBackupOptions = () => {
    return (
      <FormikWrapper initialValues={{backupFrequency: backupFrequency?.save}} innerRef={preFormRef}>
        <View style={{paddingHorizontal: 10}}>
          <View style={{paddingVertical: 5}}>
            <SelectInputField
              choices={choices}
              dropdownStyle={{paddingVertical: 5}}
              isSingleSelect
              label={'Auto-Save to Device Frequency'}
              name={'backupFrequency'}
              onValueChanged={(name, value) => dispatch(setBackupFrequency({save: value}))}
            />
          </View>
          <Text style={{...uiStyles.sectionDividerText, paddingVertical: 5}}>
            {Platform.OS === 'ios'
              ? 'Auto-saves are stored locally in the app\'s directory and can be accessed with the '
              + '"View/Edit Files on Device" button below.'
              : 'Auto-saves are stored locally in the app\'s private directory, which cannot be accessed '
              + 'directly on Android. Use Save or Save & Export to Zip to keep an accessible copy.'}
          </Text>
        </View>
      </FormikWrapper>
    );
  };

  const renderUploadAndBackupButtons = () => {
    return (
      <>
        {isUploadAvailable ? <MainMenuPanelListItem onPress={openUploadModal} title={'Upload'}/>
          : <ConnectionRequiredMessage actionText={'upload your project'}/>}
        <FlatListItemSeparator/>
        <MainMenuPanelListItem onPress={saveProject} title={'Save'}/>
        <FlatListItemSeparator/>
        <MainMenuPanelListItem
          onPress={exportProject}
          title={Platform.OS === 'ios' ? 'Save & Zip' : 'Save & Export to Zip'}
        />
      </>
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1}}>
        {renderUploadAndBackupButtons()}
        <SectionDivider dividerText={'Backup Options'}/>
        {renderBackupOptions()}
        <OutlineButton onPress={() => setIsBackupStatusModalVisible(true)} title={'Show Auto Backup Status'}/>
      </View>

      {Platform.OS === 'ios' && (
        <View style={{flex: 1, justifyContent: 'flex-end', paddingBottom: 15}}>
          <View style={{padding: 10, alignItems: 'center'}}>
            <Text style={{...uiStyles.sectionDividerText, textAlign: 'center'}}>
              Additional help documents can be found in the Menu -&gt; Help -&gt; Documentation
            </Text>
          </View>
          <OutlineButton
            icon={{
              name: 'file-tray-full-outline',
              type: 'ionicon',
              color: BLUE,
            }}
            onPress={() => openURL('ProjectBackups')}
            title={'View/Edit Files on Device'}
          />
        </View>
      )}

      {/* Modals */}
      <BackupStatusModal
        isVisible={isBackupStatusModalVisible}
        onClose={() => setIsBackupStatusModalVisible(false)}
        onUpload={onUploadFromStatus}
      />
      <SaveAndExportModal
        backupAction={backupAction}
        closeModal={() => setIsSaveAndExportModalVisible(false)}
        isVisible={isSaveAndExportModalVisible}
      />
      <UploadModal autoStart={isUploadAutoStart} closeModal={closeUploadModal} isVisible={isUploadModalVisible}/>
    </View>
  );
};

export default BackupProject;
