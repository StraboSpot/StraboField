import React, {useState} from 'react';
import {Platform} from 'react-native';

import moment from 'moment/moment';
import {useDispatch, useSelector} from 'react-redux';

import {TAG_BACKUP_ACTIONS, TAG_BACKUP_STATUS, TAG_EXPORT_MESSAGES} from './tags.constants';
import useExport from '../../services/useExport';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {clearedStatusMessages, setLoadingStatus} from '../home/home.slice';
import SaveAndExportModalContent from '../project/backup/SaveAndExportModalContent';

const ImportExportTagsModal = ({action, closeModal, isGeologicUnits}) => {
  const dispatch = useDispatch();
  const currentProject = useSelector(state => state.project.project);

  const title = isGeologicUnits ? TAG_EXPORT_MESSAGES.TITLE.GEOLOGIC_UNITS : TAG_EXPORT_MESSAGES.TITLE.TAGS;
  const defaultFileName = (moment(new Date()).format('YYYY-MM-DD_hmma') + '_'
    + currentProject.description.project_name + '_' + title).replace(/\s/g, '');

  const [backingUpStatus, setBackingUpStatus] = useState('');
  const [backupFileName, setBackupFileName] = useState(defaultFileName);
  const [isFileNameError, setIsFileNameError] = useState(false);
  const [modalTitle, setModalTitle] = useState(action + ' ' + title);

  const {zipAndExportTags} = useExport();

  const exportTags = async () => {
    try {
      console.log('FileName', backupFileName);
      setBackingUpStatus(TAG_BACKUP_STATUS.IN_PROGRESS);
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      if (Platform.OS === 'ios') setModalTitle(TAG_EXPORT_MESSAGES.STATUS.ZIPPING + title);
      else setModalTitle(TAG_EXPORT_MESSAGES.STATUS.EXPORTING + title);
      // await initializeBackup(backupFileName);  // Save first
      dispatch(clearedStatusMessages());
      await zipAndExportTags(backupFileName, isGeologicUnits);
      setBackingUpStatus(TAG_BACKUP_STATUS.COMPLETE);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      if (Platform.OS === 'ios') setModalTitle(title + TAG_EXPORT_MESSAGES.STATUS.ZIPPED);
      else setModalTitle(title + TAG_EXPORT_MESSAGES.STATUS.EXPORTED);
    }
    catch (err) {
      console.error('Error exporting project!', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      setModalTitle(TAG_EXPORT_MESSAGES.STATUS.FAILED);
      setBackingUpStatus(TAG_BACKUP_STATUS.ERROR);
    }
  };

  return (
    <ModalWrapper
      actionTitle={action}
      closeModal={closeModal}
      disabled={backupFileName.trim() === '' || isFileNameError}
      headerTitle={modalTitle}
      onActionPressed={backingUpStatus === TAG_BACKUP_STATUS.COMPLETE ? closeModal : exportTags}
      onCancelPress={closeModal}
      showActionButton={backingUpStatus === '' || backingUpStatus === TAG_BACKUP_STATUS.COMPLETE || backingUpStatus === TAG_BACKUP_STATUS.ERROR}
      showCancelButton={backingUpStatus === ''}
      showCloseButton
    >
      {action === 'Export' && (
        <SaveAndExportModalContent
          backingUpStatus={backingUpStatus}
          backupAction={isGeologicUnits ? TAG_BACKUP_ACTIONS.EXPORT_GEOLOGIC_UNITS : TAG_BACKUP_ACTIONS.EXPORT_TAGS}
          backupFileName={backupFileName}
          closeModal={closeModal}
          defaultFileName={defaultFileName}
          isFileNameError={isFileNameError}
          setBackupFileName={setBackupFileName}
          setIsFileNameError={setIsFileNameError}
        />
      )}
    </ModalWrapper>
  );
};

export default ImportExportTagsModal;
