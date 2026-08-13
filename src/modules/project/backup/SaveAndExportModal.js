import React, {useRef, useState} from 'react';
import {Platform} from 'react-native';

import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';

import SaveAndExportModalContent from './SaveAndExportModalContent';
import useExport from '../../../services/files/useExport';
import alert from '../../../shared/ui/alert';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import {clearedStatusMessages, setLoadingStatus} from '../../home/home.slice';
import {setSelectedProject} from '../projects.slice';

const SaveAndExportModal = ({backupAction, closeModal, isVisible, selectedFilename}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentProject = useSelector(state => state.project.project);

  const {initializeBackup, zipAndExportProjectFolder} = useExport();

  /* Local State */

  // A ref, not state: closing resets backingUpStatus while the save or export keeps running, so only a ref still
  // knows one is in flight and can stop a second from starting.
  const isExportInFlightRef = useRef(false);

  const [backingUpStatus, setBackingUpStatus] = useState('');
  const [backupOptions, setBackupOptions] = useState({images: true, offlineTiles: true, customMaps: true});

  const defaultFileName = selectedFilename || (moment(new Date()).format('YYYY-MM-DD_hmma') + '_'
    + currentProject.description.project_name).replace(/\s/g, '');

  const [backupFileName, setBackupFileName] = useState(defaultFileName);
  const [isFileNameError, setIsFileNameError] = useState(false);
  const [modalTitle, setModalTitle] = useState('Confirm or Change\nFolder Name');

  /* Event Handlers */

  const handleActionPressed = async () => {
    if (backingUpStatus === 'complete' || backingUpStatus === 'error') return handleClosePress();
    if (isExportInFlightRef.current) {
      return alert('Already In Progress', 'Please wait for the current save or export to finish.');
    }
    try {
      isExportInFlightRef.current = true;
      if (backupAction === 'save') await initiateBackup();
      else if (backupAction === 'export') await exportProject(backupOptions);
    }
    finally {
      isExportInFlightRef.current = false;
    }
  };

  const handleClosePress = () => {
    setBackingUpStatus('');
    setBackupFileName(defaultFileName);
    setIsFileNameError(false);
    setModalTitle('Confirm or Change Folder Name');
    closeModal();
  };

  /* Logic Helpers */

  const exportProject = async (options) => {
    try {
      console.log('FileName', backupFileName);
      setBackingUpStatus('inProgress');
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      if (Platform.OS === 'ios') setModalTitle(selectedFilename ? 'Zipping Project' : 'Saving & Zipping Project');
      else setModalTitle(selectedFilename ? 'Exporting Project' : 'Saving & Exporting Project');
      if (!selectedFilename) await initializeBackup(backupFileName, options);  // Save first
      dispatch(clearedStatusMessages());
      await zipAndExportProjectFolder(backupFileName, true, options);
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

  const initiateBackup = async () => {
    try {
      setBackingUpStatus('inProgress');
      setModalTitle('Saving Project');
      await initializeBackup(backupFileName, backupOptions);
      dispatch(setSelectedProject({source: '', project: {fileName: backupFileName}}));
      setBackingUpStatus('complete');
      setModalTitle('Project Saved!');
    }
    catch (err) {
      console.error('Error backing up file', err);
      setModalTitle('Error!');
      // Without this the status stays 'inProgress', which hides the action, cancel and close buttons alike.
      setBackingUpStatus('error');
    }
  };

  /* View */

  return (
    <ModalWrapper
      actionTitle={getButtonTitle()}
      disabled={backupFileName.trim() === '' || isFileNameError}
      headerTitle={modalTitle}
      isLoading={backingUpStatus === 'inProgress'}
      isVisible={isVisible}
      onActionPressed={backingUpStatus === 'complete' ? handleClosePress : handleActionPressed}
      onCancelPress={handleClosePress}
      overlayStyleOverride={{height: 'auto'}}
      showActionButton={backingUpStatus === '' || backingUpStatus === 'complete' || backingUpStatus === 'error'}
      showCancelButton={backingUpStatus === ''}
    >
      <SaveAndExportModalContent
        backingUpStatus={backingUpStatus}
        backupAction={backupAction}
        backupFileName={backupFileName}
        backupOptions={backupOptions}
        closeModal={closeModal}
        isFileNameError={isFileNameError}
        setBackupFileName={setBackupFileName}
        setBackupOptions={setBackupOptions}
        setIsFileNameError={setIsFileNameError}
      />
    </ModalWrapper>
  );
};

export default SaveAndExportModal;
