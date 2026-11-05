import React, {useState} from 'react';
import {Text, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useSelector} from 'react-redux';

import {runQAQC} from './qaqc_funcs';
import useDownload from '../../services/files/useDownload';
import useUpload from '../../services/files/useUpload';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {isDatasetReadOnly} from '../project/projects.helpers';

const RunQAQC = ({dataset}) => {
  /* Data Hooks */

  const encodedLogin = useSelector(state => state.user.encoded_login);
  const isTestingMode = useSelector(state => state.project.isTestingMode);
  const straboUserId = useSelector(state => state.user.straboUserId);
  const {datasets, project} = useSelector(state => state.project);

  const {initializeDownload} = useDownload();
  const toast = useToast();
  const {initializeUpload} = useUpload();

  /* Local State */

  const [isQAQCModalVisible, setIsQAQCModalVisible] = useState(false);

  /* Derived Variables */

  const isDatasetLocked = isDatasetReadOnly(datasets[dataset.id], straboUserId);
  const isProjectReadOnly = project?.isReadOnly;

  /* Event Handlers */

  const handleQAQCPressed = () => setIsQAQCModalVisible(true);

  const handleUploadAndRunPressed = async () => {
    setIsQAQCModalVisible(false);
    const toastId = toast.show(`Uploading project: ${project.description.project_name}`,
      {type: 'warning', animationType: 'slide-in', duration: 20000, placement: 'top'});
    let uploadStatus;
    try {
      uploadStatus = await initializeUpload();
    }
    catch (err) {
      toast.update(toastId, err.message, {type: 'error', duration: 5000});
      return;
    }
    if (uploadStatus.datasets !== 'uploaded') {
      toast.update(toastId, 'Failed to upload datasets.', {type: 'error', duration: 5000});
      return;
    }
    try {
      await runQAQC(dataset, project.id, encodedLogin, toast, toastId);
      await initializeDownload(project, encodedLogin);
    }
    catch (err) {
      console.error('Failed to run QAQC.', err);
      toast.update(toastId, 'Failed to run QAQC.', {type: 'error', duration: 5000});
    }
  };

  /* View */

  if (!isTestingMode || isProjectReadOnly || isDatasetLocked) return null;

  return (
    <View style={{paddingBottom: 10}}>
      <ActionButton
        onPress={handleQAQCPressed}
        title={'Run QAQC'}
      />
      {isQAQCModalVisible && (
        <ModalWrapper
          actionTitle={'Upload and Run'}
          cancelTitle={'Cancel'}
          headerTitle={'QAQC Confirmation'}
          isVisible={isQAQCModalVisible}
          onActionPressed={handleUploadAndRunPressed}
          onCancelPress={() => setIsQAQCModalVisible(false)}
          overlayStyleOverride={{height: 'auto'}}
        >
          <Text style={{textAlign: 'center'}}>{'Must upload any changes on device first'}</Text>
        </ModalWrapper>
      )}
    </View>
  );
};

export default RunQAQC;
