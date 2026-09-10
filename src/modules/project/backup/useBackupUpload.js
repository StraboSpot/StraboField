import {useState} from 'react';

import {useSelector} from 'react-redux';

import alert from '../../../shared/ui/alert';
import useIsConnectionAvailable from '../../connections/useConnectionStatus';

// Shared upload flow for the project-backup UI. Owns the UploadModal's visibility/auto-start state and the transition
// from the Auto Backup Status modal into an upload, so BackupProject and the home-screen BackupStatusIcons behave
// identically. Render <UploadModal autoStart={isUploadAutoStart} closeModal={closeUploadModal}
// isVisible={isUploadModalVisible}/> in the consumer.
const useBackupUpload = () => {
  /* Data Hooks */

  const encodedLogin = useSelector(state => state.user.encoded_login);
  const isConnectionAvailable = useIsConnectionAvailable();

  /* Local State */

  const [isUploadAutoStart, setIsUploadAutoStart] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isUploadPending, setIsUploadPending] = useState(false);

  /* Derived Variables */

  const isUploadAvailable = !!encodedLogin && isConnectionAvailable;

  /* Handlers */

  const closeUploadModal = () => {
    setIsUploadModalVisible(false);
    setIsUploadAutoStart(false);
  };

  // Open the upload modal on its confirmation screen (no auto-start). Used by the main Upload button.
  const openUploadModal = () => {
    setIsUploadAutoStart(false);
    setIsUploadModalVisible(true);
  };

  // Start an auto-running upload from the status modal: verify availability, close the status modal via the supplied
  // callback, then present the upload modal once its fade finishes (presenting during the dismiss drops the new modal
  // on iOS). isUploadPending keeps a transient host (the home-screen icon) mounted across that gap.
  const startUploadFromStatus = (closeStatusModal) => {
    if (!isUploadAvailable) {
      return alert('Upload Unavailable',
        'You must be connected to the Internet and logged in to upload to the server.');
    }
    closeStatusModal?.();
    setIsUploadPending(true);
    setTimeout(() => {
      setIsUploadPending(false);
      setIsUploadAutoStart(true);
      setIsUploadModalVisible(true);
    }, 400);
  };

  return {
    closeUploadModal,
    isUploadAutoStart,
    isUploadAvailable,
    isUploadModalVisible,
    isUploadPending,
    openUploadModal,
    startUploadFromStatus,
  };
};

export default useBackupUpload;
