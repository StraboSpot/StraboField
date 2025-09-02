import React, {useState} from 'react';
import {Platform, Text, TextInput, View} from 'react-native';

import {Button} from '@rn-vui/base';
import moment from 'moment';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import useExport from '../../../services/useExport';
import {WARNING_COLOR} from '../../../shared/styles.constants';
import ModalWrapper from '../../../shared/ui/modal/ModalWrapper';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import {clearedStatusMessages, setLoadingStatus} from '../../home/home.slice';
import overlayStyles from '../../home/overlays/overlay.styles';
import {setSelectedProject} from '../projects.slice';

const SaveAndExportModal = ({backupAction, closeModal, selectedFilename}) => {
  const dispatch = useDispatch();
  const currentProject = useSelector(state => state.project.project);
  const statusMessages = useSelector(state => state.home.statusMessages);

  const defaultFileName = selectedFilename || (moment(new Date()).format(
    'YYYY-MM-DD_hmma') + '_' + currentProject.description.project_name).replace(/\s/g, '');
  const exportFileName = `${defaultFileName}_(EXP-${moment(new Date()).format('YYYY-MM-DD_hmma')})`;

  const [backingUpStatus, setBackingUpStatus] = useState('');
  const [backupFileName, setBackupFileName] = useState(defaultFileName);
  const [isFileNameError, setIsFileNameError] = useState(false);
  const [modalTitle, setModalTitle] = useState('Confirm or Change Folder Name');

  const {initializeBackup, zipAndExportProjectFolder} = useExport();
  const toast = useToast();

  const fileName = backupFileName.replace(/\s/g, '_');

  const getButtonTitle = () => {
    if (backupAction === 'save') return 'Save';
    else {
      if (Platform.OS === 'ios') return selectedFilename ? 'Zip' : 'Save & Zip';
      else return selectedFilename ? 'Export' : 'Save & Export';
    }
  };

  const exportProject = async () => {
    try {
      console.log('FileName', exportFileName);
      setBackingUpStatus('inProgress');
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      if (Platform.OS === 'ios') setModalTitle(selectedFilename ? 'Zipping Project' : 'Saving & Zipping Project');
      else setModalTitle(selectedFilename ? 'Exporting Project' : 'Saving & Exporting Project');
      if (!selectedFilename) await initializeBackup(backupFileName);  // Save first
      dispatch(clearedStatusMessages());
      await zipAndExportProjectFolder(backupFileName, exportFileName, true);
      setBackingUpStatus('complete');
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      if (Platform.OS === 'ios') {
        setModalTitle(selectedFilename ? 'Project Zipped' : 'Project Saved and Zipped!');
        console.log('Project has been saved and zipped!');
        toast.show('Project has been saved and zipped! Please move zip out of the StraboSpot folder.');
      }
      else {
        setModalTitle(selectedFilename ? 'Project Exported to Zip!' : 'Project Saved and Exported to Zip!');
        console.log('Project has been saved and exported to the Downloads folder!');
        toast.show('Project has been exported!');
      }
    }
    catch (err) {
      console.error('Error exporting project!', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      if (Platform.OS === 'ios') toast.show('ZIP FAILED!\n' + err);
      else toast.show('EXPORT FAILED!\n' + err);
    }
  };

  const handleClosePress = () => {
    setBackingUpStatus('');
    setModalTitle('Confirm or Change Folder Name');
    closeModal();
  };

  const initiateBackup = async () => {
    try {
      setBackingUpStatus('inProgress');
      setModalTitle('Saving Project');
      await initializeBackup(backupFileName);
      dispatch(setSelectedProject({source: '', project: {fileName: backupFileName}}));
      setBackingUpStatus('complete');
      setModalTitle('Project Saved!');
    }
    catch (err) {
      console.error('Error backing up file', err);
      setModalTitle(('Error!'));
    }
  };

  const renderBackingUpView = () => (
    <View>
      <LottieAnimations
        doesLoop={backingUpStatus === 'inProgress'}
        show={backingUpStatus === 'inProgress'}
        type={backingUpStatus === 'inProgress' ? 'loadingFile' : 'complete'}
      />
      <Text style={overlayStyles.statusMessageText}>{statusMessages.join('\n')}</Text>
      <View style={overlayStyles.buttonContainer}>
        <Button
          disabled={backingUpStatus !== 'complete'}
          onPress={handleClosePress}
          title={'OK'}
          titleStyle={overlayStyles.buttonText}
          type={'clear'}
        />
      </View>
    </View>
  );

  const renderExportMessage = () => {
    return (
      <Text style={overlayStyles.contentText}>
        {Platform.OS === 'ios' ? (
          'All project data, images, and offline maps will be saved as a .zip file to the Distribution folder in '
          + 'the My Files App\\StraboField\\ProjectBackups\\Distribution.\n\nYou may want to export '
          + 'your zipped project by moving it out of the StraboField Folder using the iOS Files app.\n\n'
          + 'Zipped project will be saved as:'
        ) : (
          'All project data, images, and offline maps will be EXPORTED as a .zip file to the Downloads folder '
          + 'in the Android My Files app.\n\nZipped project will be exported as:'
        )}
      </Text>
    );
  };

  const renderSaveMessage = () => {
    return (
      <Text style={overlayStyles.contentText}>
        All datasets will be saved locally, along with any images and custom maps.
      </Text>
    );
  };

  const validateFileName = (filenameChanged) => {
    const regexp = /^[a-zA-Z0-9-_]+$/; // Check for alphanumberic characters, a dash or underscore
    if (fileName.search(regexp) === -1) setIsFileNameError(true);
    else {
      setIsFileNameError(false);
      setBackupFileName(filenameChanged);
    }
  };

  return (
    <ModalWrapper closeModal={closeModal} title={modalTitle}>
      {backingUpStatus === '' ? (
          <View>
            <View style={overlayStyles.overlayContent}>
              {backupAction === 'save' ? renderSaveMessage() : renderExportMessage()}
              <TextInput
                onChangeText={validateFileName}
                style={[overlayStyles.inputContainer, {width: '100%'}]}
                value={backupAction === 'save' ? fileName : exportFileName}
              />
            </View>
            {isFileNameError && <Text style={overlayStyles.importantText}>File Name Error!</Text>}
            <Text style={overlayStyles.statusMessageText}>
              *File names may not contain spaces or special characters, other than a dash or underscore.
              Do not use a file extension.
            </Text>
            <View style={overlayStyles.buttonContainer}>
              <Button
                disabled={backupFileName.trim() === '' || isFileNameError}
                onPress={backupAction === 'save' ? initiateBackup : exportProject}
                title={getButtonTitle()}
              />
            </View>
          </View>
        )
        : renderBackingUpView()
      }
    </ModalWrapper>
  );
};

export default SaveAndExportModal;
