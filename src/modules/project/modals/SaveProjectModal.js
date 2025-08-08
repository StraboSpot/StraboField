import React, {useEffect, useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {Button} from '@rn-vui/base';
import moment from 'moment';
import {useSelector} from 'react-redux';

import useExport from '../../../services/useExport';
import StatusDialogBox from '../../../shared/ui/StatusDialogBox';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import overlayStyles from '../../home/overlays/overlay.styles';

const SaveProjectModal = ({closeModal, visible, callback}) => {
  const currentProject = useSelector(state => state.project.project);
  const statusMessages = useSelector(state => state.home.statusMessages);

  const {initializeBackup} = useExport();

  const defaultFileName = (moment(new Date()).format(
    'YYYY-MM-DD_hmma') + '_' + currentProject.description.project_name).replace(/\s/g, '');

  const [backingUpStatus, setBackingUpStatus] = useState('');
  const [backupFileName, setBackupFileName] = useState(defaultFileName);
  const [isFileNameError, setIsFileNameError] = useState(false);

  const handleClosePress = () => {
    setBackingUpStatus('');
    closeModal();
  };

  const initiateBackup = async () => {
    try {
      setBackingUpStatus('inProgress');
      await initializeBackup(backupFileName);
      setBackingUpStatus('complete');
      if (callback) callback();
    }
    catch (err) {
      console.error('Error backing up file', err);
    }
  };

  const renderBackingUpView = () => (
    <View>
      <LottieAnimations
        type={backingUpStatus === 'inProgress' ? 'loadingFile' : 'complete'}
        show={backingUpStatus === 'inProgress'}
        doesLoop={backingUpStatus === 'inProgress'}
      />
      <Text style={overlayStyles.statusMessageText}>{statusMessages.join('\n')}</Text>
      <View style={overlayStyles.buttonContainer}>
        <Button
          title={'OK'}
          type={'clear'}
          titleStyle={overlayStyles.buttonText}
          disabled={backingUpStatus !== 'complete'}
          onPress={handleClosePress}
        />
      </View>
    </View>
  );

  const validateFileName = (fileName) => {
    setBackupFileName(fileName);
    const regexp = /^[a-zA-Z0-9-_]+$/; // Check for alphanumberic characters, a dash or underscore
    if (fileName.search(regexp) === -1) setIsFileNameError(true);
    else  setIsFileNameError(false);
  };

  return (
    <StatusDialogBox
      closeModal={handleClosePress}
      closeTitle={'Cancel'}
      confirmText={'Save'}
      isVisible={visible}
      onPress={closeModal}
      showCancelButton
      showConfirmButton
      onConfirmPress={initiateBackup}
      title={'Save Local Copy'}
      isConfirmDisabled={isFileNameError}
    >
      {backingUpStatus === '' ? (
          <View>
            <View style={overlayStyles.overlayContent}>
              <Text style={overlayStyles.contentText}>
                Save local copy of current project?
              </Text>
              <View style={{alignSelf: 'flex-start'}}>
                <Text style={[overlayStyles.contentText, {paddingBottom: 0}]}>
                  File name:
                </Text>
              </View>
              <View style={{width: '100%', paddingHorizontal: 5 }}>
              <TextInput
                value={backupFileName}
                onChangeText={validateFileName}
                style={overlayStyles.inputContainer}
              />
              </View>
              {isFileNameError && <Text style={overlayStyles.importantText}>File Name Error!</Text>}
              <Text style={overlayStyles.statusMessageText}>
                *File names may not contain spaces or special characters, other than a dash or underscore.{'\n'}
              </Text>
            </View>
          </View>
        )
        : renderBackingUpView()
      }
    </StatusDialogBox>
  );
};

export default SaveProjectModal;
