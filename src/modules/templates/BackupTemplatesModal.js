import React, {useState} from 'react';
import {Platform} from 'react-native';

import moment from 'moment/moment';
import {useDispatch, useSelector} from 'react-redux';

import {TEMPLATE_BACKUP_ACTIONS, TEMPLATE_BACKUP_MESSAGES, TEMPLATE_BACKUP_STATUS} from './templates.constants';
import useExport from '../../services/files/useExport';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {clearedStatusMessages, setLoadingStatus} from '../home/home.slice';
import SaveAndExportModalContent from '../project/backup/SaveAndExportModalContent';

const BackupTemplatesModal = ({closeModal}) => {

  /* Data Hooks */

  const dispatch = useDispatch();
  const projectName = useSelector(state => state.project.project?.description?.project_name);

  const {backupTemplates} = useExport();

  /* Local State */

  const [backingUpStatus, setBackingUpStatus] = useState('');
  const defaultFileName = (moment(new Date()).format('YYYY-MM-DD_hmma') + '_' + projectName + '_'
    + TEMPLATE_BACKUP_MESSAGES.TITLE).replace(/\s/g, '');
  const [backupFileName, setBackupFileName] = useState(defaultFileName);
  const [isFileNameError, setIsFileNameError] = useState(false);

  const actionLabel = Platform.OS === 'ios' ? 'Backup' : 'Export';
  const [modalTitle, setModalTitle] = useState(actionLabel + ' ' + TEMPLATE_BACKUP_MESSAGES.TITLE);

  /* Event Handlers */

  const handleBackup = async () => {
    try {
      console.log('FileName', backupFileName);
      setBackingUpStatus(TEMPLATE_BACKUP_STATUS.IN_PROGRESS);
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      if (Platform.OS === 'ios') {
        setModalTitle(TEMPLATE_BACKUP_MESSAGES.STATUS.ZIPPING + TEMPLATE_BACKUP_MESSAGES.TITLE);
      }
      else setModalTitle(TEMPLATE_BACKUP_MESSAGES.STATUS.EXPORTING + TEMPLATE_BACKUP_MESSAGES.TITLE);
      dispatch(clearedStatusMessages());
      await backupTemplates(backupFileName);
      setBackingUpStatus(TEMPLATE_BACKUP_STATUS.COMPLETE);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      if (Platform.OS === 'ios') setModalTitle(TEMPLATE_BACKUP_MESSAGES.TITLE + TEMPLATE_BACKUP_MESSAGES.STATUS.ZIPPED);
      else setModalTitle(TEMPLATE_BACKUP_MESSAGES.TITLE + TEMPLATE_BACKUP_MESSAGES.STATUS.EXPORTED);
    }
    catch (err) {
      console.error('Error backing up templates!', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      setModalTitle(TEMPLATE_BACKUP_MESSAGES.STATUS.FAILED);
      setBackingUpStatus(TEMPLATE_BACKUP_STATUS.ERROR);
    }
  };

  /* View */

  return (
    <ModalWrapper
      actionTitle={backingUpStatus === TEMPLATE_BACKUP_STATUS.COMPLETE ? 'Done' : actionLabel}
      closeModal={closeModal}
      disabled={backupFileName.trim() === '' || isFileNameError}
      headerTitle={modalTitle}
      isLoading={backingUpStatus === TEMPLATE_BACKUP_STATUS.IN_PROGRESS}
      onActionPressed={backingUpStatus === TEMPLATE_BACKUP_STATUS.COMPLETE ? closeModal : handleBackup}
      onCancelPress={closeModal}
      showActionButton={backingUpStatus === '' || backingUpStatus === TEMPLATE_BACKUP_STATUS.COMPLETE || backingUpStatus === TEMPLATE_BACKUP_STATUS.ERROR}
      showCancelButton={backingUpStatus === ''}
      showCloseButton
    >
      <SaveAndExportModalContent
        backingUpStatus={backingUpStatus}
        backupAction={TEMPLATE_BACKUP_ACTIONS.BACKUP_TEMPLATES}
        backupFileName={backupFileName}
        closeModal={closeModal}
        defaultFileName={defaultFileName}
        isFileNameError={isFileNameError}
        setBackupFileName={setBackupFileName}
        setIsFileNameError={setIsFileNameError}
      />
    </ModalWrapper>
  );
};

export default BackupTemplatesModal;
