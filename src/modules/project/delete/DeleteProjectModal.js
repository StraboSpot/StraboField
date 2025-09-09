import React, {useState} from 'react';
import {Text, View} from 'react-native';

import deleteProjectModalStyle from './deleteProjectModalStyle';
import {APP_DIRECTORIES} from '../../../services/directories.constants';
import useDevice from '../../../services/useDevice';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import StatusDialogBox from '../../../shared/ui/modals/StatusDialogBox';
import LottieAnimations from '../../../utils/animations/LottieAnimations';

const DeleteProjectModal = ({closeModal, isDeleteProjectModalVisible, projectToDeleteFilename, setDoReloadPage}) => {

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

  const handleConfirmPress = async () => {
    if (deleteProjectStatus === DELETE_STATUS.PENDING) await deleteProjectFromLocalStorage();
    else {
      closeModal();
      setDeleteProjectStatus(DELETE_STATUS.PENDING);
    }
  };

  return (
    <StatusDialogBox
      actionTitle={deleteProjectStatus === DELETE_STATUS.PENDING ? 'Delete' : 'Ok'}
      isVisible={isDeleteProjectModalVisible}
      onActionPressed={handleConfirmPress}
      onCancelPress={closeModal}
      showActionButton={deleteProjectStatus === DELETE_STATUS.PENDING || deleteProjectStatus !== DELETE_STATUS.IN_PROGRESS}
      showCancelButton={deleteProjectStatus === DELETE_STATUS.PENDING}
      title={'Delete Locally Saved Project'}
    >
      <View style={overlayStyles.overlayContent}>
        {deleteProjectStatus === DELETE_STATUS.PENDING ? (
          <Text style={overlayStyles.contentText}>
            Are you sure you want to delete {'\n'} the following locally saved
            project? {'\n\n' + projectToDeleteFilename}
            {'\n'}{'\n'}*Uploaded copy on server will remain.
          </Text>
        ) : (
          <>
            <Text style={deleteProjectModalStyle.contentText}>
              {deleteProjectStatus === DELETE_STATUS.IN_PROGRESS ? 'Deleting ' + projectToDeleteFilename
                : deleteProjectStatus === DELETE_STATUS.SUCCESS ? projectToDeleteFilename + ' has been deleted'
                  : 'Error deleting ' + projectToDeleteFilename}
            </Text>
            <LottieAnimations
              doesLoop={false}
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

export default DeleteProjectModal;
