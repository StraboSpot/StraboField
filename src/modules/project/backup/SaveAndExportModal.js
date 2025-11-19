import React, {useState} from 'react';
import {Platform, Text, TextInput, View} from 'react-native';

import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';

import useExport from '../../../services/useExport';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import {clearedStatusMessages, setLoadingStatus} from '../../home/home.slice';
import {setSelectedProject} from '../projects.slice';

const SaveAndExportModal = ({backupAction, closeModal, isVisible, selectedFilename}) => {
  const dispatch = useDispatch();
  const currentProject = useSelector(state => state.project.project);
  const statusMessages = useSelector(state => state.home.statusMessages);

  const defaultFileName = selectedFilename || (moment(new Date()).format(
    'YYYY-MM-DD_hmma') + '_' + currentProject.description.project_name).replace(/\s/g, '');

  const [backingUpStatus, setBackingUpStatus] = useState('');
  const [backupFileName, setBackupFileName] = useState(defaultFileName);
  const [isFileNameError, setIsFileNameError] = useState(false);
  const [modalTitle, setModalTitle] = useState('Confirm or Change\nFolder Name');

  const {initializeBackup, zipAndExportProjectFolder} = useExport();

  const fileName = backupFileName.replace(/\s/g, '_');

  const getButtonTitle = () => {
    if (backingUpStatus === '') {
      if (backupAction === 'save') return 'Save';
      if (backupAction === 'export') {
        if (Platform.OS === 'ios') return selectedFilename ? 'Zip' : 'Save & Zip';
        else return selectedFilename ? 'Export' : 'Save & Export';
      }
    }
    else if (backingUpStatus === 'complete' || backingUpStatus === 'error') return 'Close';
  };

  const exportProject = async () => {
    try {
      console.log('FileName', backupFileName);
      setBackingUpStatus('inProgress');
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      if (Platform.OS === 'ios') setModalTitle(selectedFilename ? 'Zipping Project' : 'Saving & Zipping Project');
      else setModalTitle(selectedFilename ? 'Exporting Project' : 'Saving & Exporting Project');
      if (!selectedFilename) await initializeBackup(backupFileName);  // Save first
      dispatch(clearedStatusMessages());
      await zipAndExportProjectFolder(backupFileName, true);
      setBackingUpStatus('complete');
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      if (Platform.OS === 'ios') setModalTitle(selectedFilename ? 'Project Zipped' : 'Project Saved and Zipped!');
      else setModalTitle(selectedFilename ? 'Project Exported to Zip!' : 'Project Saved and Exported to Zip!');
    }
    catch (err) {
      console.error('Error exporting project!', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      setModalTitle(selectedFilename ? 'Export Failed!' : 'Save & Export Failed!');
      setBackingUpStatus('error');
    }
  };

  const handleClosePress = () => {
    setBackingUpStatus('');
    setModalTitle('Confirm or Change Folder Name');
    closeModal();
  };

  const handleActionPressed = async () => {
    if (backingUpStatus === 'complete' || backingUpStatus === 'error') handleClosePress();
    else {
      if (backupAction === 'save') await initiateBackup();
      else if (backupAction === 'export') await exportProject();
    }
  };

  const initiateBackup = async () => {
    try {
      setBackingUpStatus('inProgress');
      setModalTitle('Saving Project');
      await initializeBackup(backupFileName);
      dispatch(setSelectedProject({source: '', project: {fileName: backupFileName}}));
      setBackingUpStatus('complete');
      setModalTitle('Project Saved!');
    }
    catch (err) {
      console.error('Error backing up file', err);
      setModalTitle(('Error!'));
    }
  };

  const renderBackingUpView = () => (
    <View style={{padding: 20, alignItems: 'center'}}>
      <LottieAnimations
        doesLoop={backingUpStatus === 'inProgress'}
        show
        type={backingUpStatus === 'inProgress' ? 'loadingFile'
          : backingUpStatus === 'complete' ? 'complete' : 'error'}
      />
      <Text style={{marginTop: 12, textAlign: 'center', color: '#444'}}>
        {statusMessages.join('\n')}
      </Text>
    </View>
  );

  const validateFileName = (filenameChanged) => {
    const regexp = /^[a-zA-Z0-9-_]*$/; // Check for alphanumeric characters, a dash or underscore (allow empty)
    const fileNameWithUnderscores = filenameChanged.replace(/\s/g, '_');
    if (fileNameWithUnderscores.search(regexp) === -1) setIsFileNameError(true);
    else setIsFileNameError(false);
    setBackupFileName(filenameChanged);
  };

  return (
    <ModalWrapper
      actionTitle={getButtonTitle()}
      disabled={backupFileName.trim() === '' || isFileNameError}
      headerTitle={modalTitle}
      isVisible={isVisible}
      onActionPressed={backingUpStatus === 'complete' ? handleClosePress : handleActionPressed}
      onCancelPress={handleClosePress}
      showActionButton={backingUpStatus === '' || backingUpStatus === 'complete' || backingUpStatus === 'error'}
      showCancelButton={backingUpStatus === ''}
    >
      {backingUpStatus === '' ? (
        <View style={{padding: 16}}>
          {/* Instruction Text */}
          <Text style={{fontSize: 16, marginBottom: 12, color: '#444'}}>
            {backupAction === 'save' ? (
              'All datasets will be saved locally, along with any images and custom maps.'
            ) : (
              Platform.OS === 'ios'
                ? 'Your project will be saved as a .zip in the Distribution folder.\n\nMove it out of StraboField using the iOS Files app.\n\nZipped project will be saved as:'
                : 'Your project will be exported as a .zip into the Downloads folder on Android.\n\nZipped project will be exported as:'
            )}
          </Text>

          {/* File Name Input */}
          <Text style={{fontWeight: '600', marginBottom: 6}}>File Name</Text>
          <TextInput
            onChangeText={validateFileName}
            style={[
              {
                borderWidth: 1,
                borderColor: isFileNameError ? 'red' : '#ccc',
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                fontSize: 15,
                backgroundColor: '#fafafa',
              },
            ]}
            value={fileName}
          />
          {isFileNameError && (
            <Text style={{color: 'red', marginBottom: 8, fontSize: 13}}>
              File Name Error! Only letters, numbers, dashes, or underscores allowed.
            </Text>
          )}
          <Text style={{fontSize: 12, color: '#666', marginBottom: 16}}>
            *File names cannot contain spaces or special characters. Do not include a file extension.
          </Text>
        </View>
      ) : (
        renderBackingUpView()
      )}
    </ModalWrapper>
  );
};

export default SaveAndExportModal;
