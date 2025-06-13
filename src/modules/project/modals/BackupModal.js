import React, {useEffect, useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {Button} from '@rn-vui/base';
import moment from 'moment';
import {useSelector} from 'react-redux';

import useExport from '../../../services/useExport';
import {isEmpty} from '../../../shared/Helpers';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import overlayStyles from '../../home/overlays/overlay.styles';
import MenuModal from '../MenuModal';

const BackupModal = ({closeModal, visible}) => {
  const currentProject = useSelector(state => state.project.project);
  const statusMessages = useSelector(state => state.home.statusMessages);
  const [backupFileName, setBackupFileName] = useState('');
  const [backingUpStatus, setBackingUpStatus] = useState('');
  const [modalTitle, setModalTitle] = useState('Confirm or Change Folder Name');

  const {initializeBackup} = useExport();

  useEffect(() => {
    console.log('UE BackupModal');
    // console.log('UE BackupModal [currentProject, user]', currentProject, userEmail);
    if (!isEmpty(currentProject) && visible) {
      setBackupFileName(moment(new Date()).format('YYYY-MM-DD_hmma') + '_' + currentProject.description.project_name);
    }
  }, [currentProject, visible]);

  const fileName = backupFileName.replace(/\s/g, '_');

  const handleClosePress = () => {
    setBackingUpStatus('');
    setModalTitle('Confirm or Change Folder Name');
    closeModal();
  };

  const initiateBackup = async () => {
    try {
      setBackingUpStatus('inProgress');
      setModalTitle('Backing Up');
      await initializeBackup(backupFileName);
      setBackingUpStatus('complete');
      setModalTitle('All backed up!');
    }
    catch (err) {
      console.error('Error backing up file', err);
      setModalTitle(('Error!'));
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

  return (
    <MenuModal
      modalTitle={modalTitle}
      visible={visible}
      onPress={closeModal}
      overlayStyle={{maxHeight: 400}}
    >
      {backingUpStatus === '' ? (
          <View>
            <View>
              <Text style={overlayStyles.contentText}>
                <Text style={overlayStyles.importantText}>ALL</Text>
                <Text> datasets, active and inactive, will be
                  exported along with the images, and custom maps.</Text>
              </Text>
              <Text style={overlayStyles.contentText}>If you change the folder name please do not use spaces, special
                characters (except a dash or
                underscore), or add a file extension.</Text>
            </View>
            <View style={overlayStyles.overlayContent}>
              <TextInput
                value={fileName || ''}
                onChangeText={text => setBackupFileName(text)}
                style={overlayStyles.inputContainer}
              />
            </View>
            <View style={overlayStyles.buttonContainer}>
              <Button
                title={'BACKUP'}
                type={'clear'}
                disabled={backupFileName.trim() === ''}
                titleStyle={overlayStyles.buttonText}
                onPress={initiateBackup}
              />
              <Button
                title={'CANCEL'}
                type={'clear'}
                titleStyle={overlayStyles.buttonText}
                onPress={handleClosePress}
              />
            </View>
          </View>
        )
        : renderBackingUpView()
      }
    </MenuModal>
  );
};

export default BackupModal;
