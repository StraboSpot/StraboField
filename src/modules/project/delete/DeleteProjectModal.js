import React, {useState} from 'react';
import {Text, View} from 'react-native';

import useDevice from '../../../services/device/useDevice';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import LottieAnimations from '../../../utils/animations/LottieAnimations';

const DELETE_STATUS = {
  IN_PROGRESS: 'in_progress',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Deletes filePaths, which label names to the user; isPlural when that is more than one save
const DeleteProjectModal = ({closeModal, filePaths, isDeleteProjectModalVisible, isPlural, label, onDeleted}) => {
  /* Data Hooks */

  const {deleteFromDevice, doesDeviceDirExist} = useDevice();

  /* Local State */

  const [deleteProjectStatus, setDeleteProjectStatus] = useState(DELETE_STATUS.PENDING);

  /* Event Handlers */

  const handleConfirmPress = async () => {
    if (deleteProjectStatus === DELETE_STATUS.PENDING) await deleteProjectFromLocalStorage();
    else {
      closeModal();
      setDeleteProjectStatus(DELETE_STATUS.PENDING);
    }
  };

  /* Logic Helpers */

  const deleteProjectFromLocalStorage = async () => {
    try {
      setDeleteProjectStatus(DELETE_STATUS.IN_PROGRESS);
      for (const filePath of filePaths) {
        if (await doesDeviceDirExist(filePath)) await deleteFromDevice(filePath);
      }
      setDeleteProjectStatus(DELETE_STATUS.SUCCESS);
      onDeleted();
    }
    catch (err) {
      setDeleteProjectStatus(DELETE_STATUS.ERROR);
      console.error('Error deleting project!', err);
    }
  };

  /* View */

  return (
    <ModalWrapper
      actionTitle={deleteProjectStatus === DELETE_STATUS.PENDING ? 'Delete' : 'Ok'}
      headerTitle={isPlural ? 'Delete Locally Saved Projects' : 'Delete Locally Saved Project'}
      isLoading={deleteProjectStatus === DELETE_STATUS.IN_PROGRESS}
      isVisible={isDeleteProjectModalVisible}
      onActionPressed={handleConfirmPress}
      onCancelPress={closeModal}
      showActionButton={deleteProjectStatus === DELETE_STATUS.PENDING || deleteProjectStatus !== DELETE_STATUS.IN_PROGRESS}
      showCancelButton={deleteProjectStatus === DELETE_STATUS.PENDING}
    >
      <View style={overlayStyles.overlayContent}>
        {deleteProjectStatus === DELETE_STATUS.PENDING ? (
          <Text style={overlayStyles.contentText}>
            Are you sure you want to delete{'\n\n' + label + '?'}
            {'\n'}{'\n'}*Only copies uploaded to the server, exported, or copied out of the app's folder will remain.
          </Text>
        ) : (
          <>
            <Text style={overlayStyles.contentText}>
              {deleteProjectStatus === DELETE_STATUS.IN_PROGRESS ? 'Deleting ' + label
                : deleteProjectStatus === DELETE_STATUS.SUCCESS ? 'Deleted ' + label
                  : 'Error deleting ' + label}
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
    </ModalWrapper>
  );
};

export default DeleteProjectModal;
