import React, {useRef, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {Field, Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import SaveAndExportModal from './SaveAndExportModal';
import UploadModal from './UploadModal';
import useDevice from '../../../services/device/useDevice';
import {BLUE} from '../../../shared/styles.constants';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import SectionDivider from '../../../shared/ui/SectionDivider';
import uiStyles from '../../../shared/ui/ui.styles';
import {setBackupFrequency} from '../../connections/connections.slice';
import SelectInputField from '../../form/SelectInputField';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../../home/home.slice';
import MainMenuPanelListItem from '../../main-menu-panel/MainMenuPanelListItem';
import {setSelectedProject} from '../projects.slice';

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
  const isOnline = useSelector(state => state.connections.isOnline);
  const user = useSelector(state => state.user);

  const {openURL} = useDevice();

  /* Local State */

  const [backupAction, setBackupAction] = useState(undefined);
  const [isSaveAndExportModalVisible, setIsSaveAndExportModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

  /* Event Handlers */

  const onUpload = () => {
    dispatch(setSelectedProject({source: '', project: ''}));
    setIsUploadModalVisible(true);
  };

  /* Logic Helpers */

  const checkForActiveDatasets = (backupActionToSet) => {
    if (activeDatasets.length > 0) {
      setIsSaveAndExportModalVisible(true);
      setBackupAction(backupActionToSet);
    }
    else {
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('There are no visible datasets selected.'));
      dispatch(setIsErrorMessagesModalVisible(true));
    }
  };

  const exportProject = () => checkForActiveDatasets('export');

  const saveProject = () => checkForActiveDatasets('save');

  /* Render Functions */

  const renderBackupOptions = () => {
    return (
      <Formik
        initialValues={{backupFrequency: backupFrequency?.save, uploadFrequency: backupFrequency?.upload}}
        innerRef={preFormRef}
        onSubmit={values => console.log('Submit: ', values, ' |')}
        validate={values => dispatch(
          setBackupFrequency({save: values.backupFrequency, upload: values.uploadFrequency}))}
      >
        {() => (
          <View style={{paddingHorizontal: 10}}>
            <View style={{paddingVertical: 5}}>
              <Field
                choices={choices}
                component={formProps => SelectInputField(
                  {setFieldValue: formProps.form.setFieldValue, ...formProps.field, ...formProps})}
                label={'Auto-Save Frequency'}
                multiSelectStyle={{paddingVertical: 5}}
                name={'backupFrequency'}
                single
              />
              <Field
                choices={choices}
                component={formProps => SelectInputField(
                  {setFieldValue: formProps.form.setFieldValue, ...formProps.field, ...formProps})}
                label={'Auto-Upload Frequency'}
                multiSelectStyle={{paddingVertical: 5}}
                name={'uploadFrequency'}
                single
              />
              {/*<AutoSaveCountdown/>*/}
              {/*<AutoUploadCountdown/>*/}
            </View>
          </View>
        )}
      </Formik>

    );
  };

  const renderUploadAndBackupButtons = () => {
    return (
      <>
        {user.encoded_login && isOnline.isConnected ? <MainMenuPanelListItem onPress={onUpload} title={'Upload'}/>
          : (
            <View style={uiStyles.spacer}>
              <Text style={overlayStyles.importantText}>Please log in to upload your project.</Text>
            </View>
          )}
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
      <SaveAndExportModal
        backupAction={backupAction}
        closeModal={() => setIsSaveAndExportModalVisible(false)}
        isVisible={isSaveAndExportModalVisible}
      />
      <UploadModal closeModal={() => setIsUploadModalVisible(false)} isVisible={isUploadModalVisible}/>
    </View>
  );
};

export default BackupProject;
