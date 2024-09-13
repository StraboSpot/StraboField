import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import moment from 'moment/moment';
import {Button, CheckBox, Input, Overlay} from 'react-native-elements';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import projectOptionsModalStyle from './projectOptionsModal.style';
import {APP_DIRECTORIES} from '../../../../services/directories.constants';
import {STRABO_APIS} from '../../../../services/urls.constants';
import useDeviceHook from '../../../../services/useDevice';
import useExportHook from '../../../../services/useExport';
import commonStyles from '../../../../shared/common.styles';
import {isEmpty, truncateText} from '../../../../shared/Helpers';
import modalStyle from '../../../../shared/ui/modal/modal.style';
import ModalHeader from '../../../../shared/ui/modal/ModalHeader';
import Spacer from '../../../../shared/ui/Spacer';
import uiStyles from '../../../../shared/ui/ui.styles';
import LottieAnimations from '../../../../utils/animations/LottieAnimations';
import {
  setLoadingStatus,
  setIsProgressModalVisible,
} from '../../../home/home.slice';
import overlayStyles from '../../../home/overlays/overlay.styles';
import {BACKUP_TO_DEVICE, BACKUP_TO_SERVER, OVERWRITE} from '../../project.constants';
import {setSelectedProject} from '../../projects.slice';
import useProjectHook from '../../useProject';

const ProjectOptionsDialogBox = ({
                                   closeModal,
                                   currentProject,
                                   endpoint,
                                   projectDeleted,
                                   visible,
                                 }) => {
  const dispatch = useDispatch();
  const selectedProject = useSelector(state => state.project.selectedProject);
  const currentProjectName = useSelector(state => state.project.project?.description?.project_name);

  const [action, setAction] = useState('');
  const [backupFileName, setBackupFileName] = useState('');
  const [checked, setChecked] = useState(1);
  const [deletingProjectStatus, setDeletingProjectStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [exportFileName, setExportFileName] = useState('');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeMapTiles, setIncludeMapTiles] = useState(true);
  const [isProgressModalVisibleLocal, setIsProgressModalVisibleLocal] = useState(false);
  const [projectToDeleteName, setProjectToDeleteName] = useState('');

  const useProject = useProjectHook();
  const toast = useToast();
  const useDevice = useDeviceHook();
  const useExport = useExportHook();

  useEffect(() => {
    console.log('Images Included:', includeImages);
    console.log('Maps Included:', includeMapTiles);
  }, [includeImages, includeMapTiles]);

  useEffect(() => {
    if (!isEmpty(currentProjectName)) {
      setBackupFileName(moment(new Date()).format('YYYY-MM-DD_hmma') + '_' + currentProjectName);
      setExportFileName(`${selectedProject?.project?.fileName}_(EXP-${moment(new Date()).format('YYYY-MM-DD_hmma')})`);
    }
  }, [checked]);

  const deleteProjectFromLocalStorage = async () => {
    try {
      closeModal();
      setDeletingProjectStatus('deleting');
      setIsProgressModalVisibleLocal(true);
      setTimeout(async () => {
        setChecked(1);
        setProjectToDeleteName(selectedProject?.project?.fileName || '');
        await useDevice.deleteFromDevice(APP_DIRECTORIES.BACKUP_DIR, selectedProject.project.fileName);
        setDeletingProjectStatus('complete');
        projectDeleted(true);
      }, 1000);
    }
    catch (err) {
      console.error('Error deleting project!', err);
      toast.show(`${selectedProject.project.fileName} does not exist!`, {type: 'danger'});
      setChecked(3);
    }
  };

  const exportProject = async () => {
    try {
      console.log('FileName', exportFileName);
      closeModal();
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      await useExport.zipAndExportProjectFolder(selectedProject.project.fileName, exportFileName, true);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      console.log('Project has been exported to Downloads folder!');
      toast.show('Project has been exported!');
      setChecked(1);
      setIncludeMapTiles(true);
      setIncludeImages(true);
    }
    catch (err) {
      console.error('Error exporting project!', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      toast.show('EXPORT FAILED!\n' + err);
    }
  };

  const handleOnPress = async (userAction) => {
    if (userAction === BACKUP_TO_DEVICE) {
      await saveProject();
      console.log('Project Saved!');
    }
    else if (userAction === OVERWRITE) {
      closeModal();
      await useProject.switchProject(OVERWRITE);
      console.log('Project overwritten!');
    }
    else {
      closeModal();
      setAction('');
      setChecked(1);
      dispatch(setIsProgressModalVisible(true));
      // console.log('Project Overwritten or Uploaded!');
    }
  };

  const goBack = () => {
    setErrorMessage('');
    setAction('');
  };

  const onClose = () => {
    dispatch(setSelectedProject({project: {}, source: ''}));
    setChecked(1);
    setAction('');
    setIncludeMapTiles(true);
    setIncludeImages(true);
    closeModal();
  };

  const saveProject = async () => {
    const containsSpecialCharacters = validateCharacters();
    if (containsSpecialCharacters) setErrorMessage('Cannot contain special characters');
    else {
      console.log('Saving Project to Device');
      setErrorMessage('');
      closeModal();
      await useExport.initializeBackup(backupFileName);
    }
  };

  const renderExportMessage = () => {
    if (Platform.OS === 'ios') {
      return (
        <View>
          <Text>All project data, images, and offline maps will be EXPORTED as a .ZIP file to the Distribution folder in
            the My Files App &gt; StraboSpot2 &gt; ProjectBackups &gt; Distribution.</Text>
        </View>
      );
    }
    else {
      return (
        <View>
          <Text style={overlayStyles.statusMessageText}>
            <Text> All project data, images, and offline maps will be EXPORTED as a .ZIP file to the Downloads folder in
              the My Files App.</Text>
          </Text>
        </View>
      );
    }
  };

  const renderActionView = () => {
    switch (checked) {
      case 1:
        return (
          <View>
            <View style={uiStyles.sectionDivider}>
              <Text style={overlayStyles.statusMessageText}>What do you want to do with
                the current project ({currentProjectName})?</Text>
            </View>
            <View style={{padding: 10}}>
              {selectedProject.source !== 'new' && <Button
                title={'Overwrite'}
                type={'outline'}
                containerStyle={{padding: 2.5}}
                onPress={() => setAction(OVERWRITE)}
              />}
              <Button
                title={'Save to Device'}
                type={'outline'}
                containerStyle={{padding: 2.5}}
                onPress={() => setAction(BACKUP_TO_DEVICE)}
              />
              <Button
                title={'Upload'}
                type={'outline'}
                containerStyle={{padding: 2.5}}
                onPress={() => setAction(BACKUP_TO_SERVER)}
              />
            </View>
          </View>
        );
      case 2:
        return renderDeleteView();
      case 3:
        return (
          <View>
            {renderExportMessage()}
            <View style={overlayStyles.overlayContent}>
              <Text>Project will be exported as: {exportFileName}</Text>
            </View>
            <View>
              <Button
                title={'Export Project to Device'}
                type={'clear'}
                onPress={() => exportProject()}
              />
            </View>
          </View>
        );
    }
  };

  const renderBackupView = () => {
    return (
      <View>
        <View style={overlayStyles.overlayContent}>
          <Text style={overlayStyles.statusMessageText}>Save current project to local storage:</Text>
          <Text style={overlayStyles.statusMessageText}>{truncateText(currentProjectName, 30)} as:</Text>
          <Input
            value={backupFileName.replace(/\s/g, '')}
            onChangeText={text => setBackupFileName(text)}
            containerStyle={overlayStyles.inputContainer}
            inputStyle={{fontSize: 14}}
            errorMessage={errorMessage}
          />
          <Text style={projectOptionsModalStyle.backupViewInputHeaderText}>Dashes and underscores are allowed</Text>
        </View>
      </View>
    );
  };

  const renderDeleteView = () => {
    const projectName = selectedProject?.project.fileName;
    return (
      <View>
        <View>
          <Text style={overlayStyles.importantText}>Are you sure you want to
            delete{'\n' + projectName}?
          </Text>
          <Text style={overlayStyles.statusMessageText}>This will
            <Text style={overlayStyles.importantText}> ERASE </Text>
            the backed up version of this project LOCALLY including Spots, images, and all other data!
          </Text>
        </View>
        <Button
          title={'DELETE'}
          titleStyle={[overlayStyles.buttonText, projectOptionsModalStyle.deleteButtonText]}
          buttonStyle={overlayStyles.buttonContainer}
          type={'clear'}
          onPress={() => deleteProjectFromLocalStorage(projectName)}
        />
      </View>
    );
  };

  const renderOverwriteView = () => {
    return (
      <View style={overlayStyles.overlayContent}>
        <Text style={overlayStyles.contentText}>Switching projects will
          <Text style={[overlayStyles.importantText]}> OVERWRITE </Text>
          the local copy of the current project:
        </Text>
        <Text style={[overlayStyles.importantText, overlayStyles.contentText]}>
          {currentProject
          && !isEmpty(
            currentProject.description) ? currentProject.description.project_name.toUpperCase() : 'UN-NAMED'}
        </Text>
        <Text style={overlayStyles.contentText}>Including all datasets and Spots contained within this project. Make
          sure you have already uploaded the project to the server or backed it up to the device if you wish to preserve
          the data.
        </Text>
      </View>
    );
  };

  const renderSectionView = () => {
    switch (action) {
      case OVERWRITE:
        return (
          renderOverwriteView()
        );
      case BACKUP_TO_DEVICE:
        return (
          renderBackupView()
        );
      case BACKUP_TO_SERVER:
        return renderUploadView();
      default:
        return renderActionView();
    }
  };

  const renderUploadView = () => {
    return (
      <View>
        <View>
          <Text style={overlayStyles.importantText}>Uploading {'\n'}{!isEmpty(
            currentProject) && currentProject.description.project_name} {'\n'}to:</Text>
          <Text style={overlayStyles.importantText}>
            {endpoint?.isSelected ? endpoint.url : STRABO_APIS.DB}
          </Text>
        </View>
        <Spacer/>
        <Text>
          <Text style={overlayStyles.importantText}> </Text>
          project properties and datasets will be uploaded and will
          <Text style={overlayStyles.importantText}> OVERWRITE</Text> any data already on the server
          for this project:
        </Text>
      </View>
    );
  };

  const validateCharacters = () => {
    const format = /[`!@#$%^&*()+=[\]{};':"\\|,.<>/?~]+/;
    return format.test(backupFileName);
  };

  const radioButtonArr = ['Load Project', 'Delete', 'Export'];
  // const displayedButtons = selectedProject.source === 'device' && Platform.OS === 'ios' ? radioButtonArr.slice(0,
  //   2) : radioButtonArr;
  const showExportChoice = selectedProject.source === 'device';
  const header = selectedProject.source === 'device' ? 'Selected Device Project:' : selectedProject.source === 'server'
    ? 'Selected Server Project:' : null;
  const projectName = `${selectedProject.source === 'server' ? selectedProject.project.name : selectedProject.source === 'device'
    ? selectedProject.project.fileName : 'New Project'}`;
  return (
    <>
      <Overlay
        animationType={'slide'}
        overlayStyle={overlayStyles.overlayContainer}
        backdropStyle={overlayStyles.backdropStyles}
        isVisible={visible}
      >
        <ModalHeader
          closeModal={onClose}
          title={(header ? header + '\n' : '') + projectName}
        />
        {selectedProject.source === 'new'
          && (
            <Text style={overlayStyles.importantText}>Starting a new project will overwrite the current
              project. Press Close if that is ok.
            </Text>
          )}
        {showExportChoice && radioButtonArr.map((l, i) => (
          <CheckBox
            key={i}
            title={l}
            containerStyle={commonStyles.checkboxContainer}
            checkedIcon={'dot-circle-o'}
            uncheckedIcon={'circle-o'}
            checked={checked === i + 1}
            onPress={() => {
              setAction('');
              setChecked(i + 1);
            }}
          />))}
        <View>
          {renderSectionView()}
        </View>
        {action !== '' && <View style={overlayStyles.buttonContainer}>
          <Button
            title={'Cancel'}
            type={'clear'}
            onPress={() => goBack()}
          />
          <Button
            title={'Continue'}
            type={'clear'}
            onPress={() => handleOnPress(action)}
          />
        </View>}
      </Overlay>
      <Overlay
        isVisible={isProgressModalVisibleLocal}
        overlayStyle={overlayStyles.overlayContainer}
      >
        <Text style={modalStyle.modalTitle}>{'Deleting...'}</Text>
        <View style={overlayStyles.overlayContent}>
          {deletingProjectStatus !== 'complete'
            ? <Text style={projectOptionsModalStyle.projectNameText}>Deleting {projectToDeleteName}</Text>
            : <Text style={projectOptionsModalStyle.projectNameText}>{projectToDeleteName} has been deleted.</Text>
          }
          <LottieAnimations
            type={deletingProjectStatus === 'deleting' ? 'deleteProject' : 'complete'}
            doesLoop={deletingProjectStatus === 'deleteProject'}
            show={deletingProjectStatus === 'deleteProject'}
          />
        </View>
        {deletingProjectStatus === 'complete' && (
          <Button
            onPress={() => setIsProgressModalVisibleLocal(false)}
            title={'Close'}
            type={'clear'}
          />
        )}
      </Overlay>
    </>
  );
};

export default ProjectOptionsDialogBox;
