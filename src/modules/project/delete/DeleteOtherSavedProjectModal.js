import React, {useState} from 'react';
import {Text, View} from 'react-native';

import projectOptionsModalStyle from './projectOptionsModal.style';
import {APP_DIRECTORIES} from '../../../services/directories.constants';
import useDevice from '../../../services/useDevice';
import StatusDialogBox from '../../../shared/ui/StatusDialogBox';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import overlayStyles from '../../home/overlays/overlay.styles';

const DeleteOtherSavedProjectModal = ({closeModal, projectToDeleteFilename, setDoReloadPage}) => {

  const DELETE_STATUS = {
    IN_PROGRESS: 'in_progress',
    PENDING: 'pending',
    SUCCESS: 'success',
    ERROR: 'error',
  };

  const [deleteProjectStatus, setDeleteProjectStatus] = useState(DELETE_STATUS.PENDING);

  const {deleteFromDevice} = useDevice();

  const deleteProjectFromLocalStorage = async () => {
    try {
      setDeleteProjectStatus(DELETE_STATUS.IN_PROGRESS);
      await deleteFromDevice(APP_DIRECTORIES.BACKUP_DIR, projectToDeleteFilename);
      setDeleteProjectStatus(DELETE_STATUS.SUCCESS);
      setDoReloadPage(true);
    }
    catch (err) {
      setDeleteProjectStatus(DELETE_STATUS.ERROR);
      console.error('Error deleting project!', err);
    }
  };

  const handleConfirmPress = () => {
    if (deleteProjectStatus === DELETE_STATUS.PENDING) deleteProjectFromLocalStorage();
    else closeModal();
  };

  return (
    <StatusDialogBox
      closeModal={closeModal}
      closeTitle={'Cancel'}
      confirmText={deleteProjectStatus === DELETE_STATUS.PENDING ? 'Delete' : 'Ok'}
      isVisible={true}
      onConfirmPress={handleConfirmPress}
      showCancelButton={deleteProjectStatus === DELETE_STATUS.PENDING}
      showConfirmButton={deleteProjectStatus === DELETE_STATUS.PENDING || deleteProjectStatus !== DELETE_STATUS.IN_PROGRESS}
      title={'Delete Local Copy'}
    >
      <View style={overlayStyles.overlayContent}>
        {deleteProjectStatus === DELETE_STATUS.PENDING ? (
          <Text style={overlayStyles.contentText}>
            Are you sure you want to delete {'\n'} the following local copy? {'\n\n' + projectToDeleteFilename}
            {'\n'}{'\n'}*Uploaded copy on server will remain.
          </Text>
        ) : (
          <>
            <Text style={projectOptionsModalStyle.contentText}>
              {deleteProjectStatus === DELETE_STATUS.IN_PROGRESS ? 'Deleting ' + projectToDeleteFilename
                : deleteProjectStatus === DELETE_STATUS.SUCCESS ? projectToDeleteFilename + ' has been deleted'
                  : 'Error deleting ' + projectToDeleteFilename}
            </Text>
            <LottieAnimations
              type={deleteProjectStatus === DELETE_STATUS.IN_PROGRESS ? 'deleteProject'
                : deleteProjectStatus === DELETE_STATUS.SUCCESS ? 'complete'
                  : 'error'}
            />
          </>
        )}
      </View>
    </StatusDialogBox>
  );
};

export default DeleteOtherSavedProjectModal;
