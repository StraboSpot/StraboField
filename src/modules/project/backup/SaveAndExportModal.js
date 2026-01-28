import React, {useState} from 'react';
import {Platform} from 'react-native';

import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';

import useExport from '../../../services/useExport';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import {clearedStatusMessages, setLoadingStatus} from '../../home/home.slice';
import {setSelectedProject} from '../projects.slice';
import SaveAndExportModalContent from './SaveAndExportModalContent';

const SaveAndExportModal = ({backupAction, closeModal, isVisible, selectedFilename}) => {
  const dispatch = useDispatch();
  const currentProject = useSelector(state => state.project.project);

  const defaultFileName = selectedFilename || (moment(new Date()).format(
    'YYYY-MM-DD_hmma') + '_' + currentProject.description.project_name).replace(/\s/g, '');

  const [backingUpStatus, setBackingUpStatus] = useState('');
  const [backupFileName, setBackupFileName] = useState(defaultFileName);
  const [isFileNameError, setIsFileNameError] = useState(false);
  const [modalTitle, setModalTitle] = useState('Confirm or Change\nFolder Name');

  const {initializeBackup, zipAndExportProjectFolder} = useExport();

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

  return (
    <ModalWrapper
      overlayStyleOverride={{height: 'auto'}}
      actionTitle={getButtonTitle()}
      disabled={backupFileName.trim() === '' || isFileNameError}
      headerTitle={modalTitle}
      isVisible={isVisible}
      onActionPressed={backingUpStatus === 'complete' ? handleClosePress : handleActionPressed}
      onCancelPress={handleClosePress}
      showActionButton={backingUpStatus === '' || backingUpStatus === 'complete' || backingUpStatus === 'error'}
      showCancelButton={backingUpStatus === ''}
    >
      <SaveAndExportModalContent
        backingUpStatus={backingUpStatus}
        backupAction={backupAction}
        backupFileName={backupFileName}
        closeModal={closeModal}
        isFileNameError={isFileNameError}
        setBackupFileName={setBackupFileName}
        setIsFileNameError={setIsFileNameError}
      />
    </ModalWrapper>
  );
};

export default SaveAndExportModal;
