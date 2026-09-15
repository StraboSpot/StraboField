import React, {useState} from 'react';
import {Text, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useSelector} from 'react-redux';

import {runQAQC} from './qaqc_funcs';
import useDownload from '../../services/files/useDownload';
import useUpload from '../../services/files/useUpload';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const RunQAQC = ({dataset}) => {
  /* Data Hooks */

  const encodedLogin = useSelector(state => state.user.encoded_login);
  const isTestingMode = useSelector(state => state.project.isTestingMode);
  const {datasets, project} = useSelector(state => state.project);
  const readOnlyDatasetsIds = useSelector(state => state.project.readOnlyDatasetsIds) || [];

  const {initializeDownload} = useDownload();
  const toast = useToast();
  const {initializeUpload} = useUpload();

  /* Local State */

  const [isQAQCModalVisible, setIsQAQCModalVisible] = useState(false);

  /* Event Handlers */

  const handleQAQCPressed = () => setIsQAQCModalVisible(true);

  /* View */

  const isDatasetReadOnly = datasets[dataset.id]?.isReadOnly || readOnlyDatasetsIds.includes(dataset.id);
  const isProjectReadOnly = project?.isReadOnly;

  if (!isTestingMode || isProjectReadOnly || isDatasetReadOnly) return null;

  return (
    <View style={{paddingBottom: 10}}>
      <ActionButton
        onPress={handleQAQCPressed}
        title={'Run QAQC'}
      />

      {/* Modal */}
      {isQAQCModalVisible && (
        <ModalWrapper
          actionTitle={'Upload and Run'}
          cancelTitle={'Cancel'}
          headerTitle={'QAQC Confirmation'}
          isVisible={isQAQCModalVisible}
          onActionPressed={async () => {
            setIsQAQCModalVisible(false);
            let toast_id = toast.show(`Uploading project: ${project.description.project_name}`,
              {type: 'warning', animationType: 'slide-in', duration: 20000, placement: 'top'});
            let uploadStatus = await initializeUpload();
            if (uploadStatus.datasets === 'uploaded') {
              try {
                await runQAQC(dataset, project.id, encodedLogin, toast, toast_id);
                await initializeDownload(project, encodedLogin);
              }
              catch (err) {
                toast.update(toast_id, 'Failed to run QAQC.', {type: 'error', duration: 5000});
              }
            }
            else {
              toast.update(toast_id, 'Failed to upload datasets.', {type: 'error', duration: 5000});
            }
          }}
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
