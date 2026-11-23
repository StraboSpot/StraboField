import {Platform} from 'react-native';

import RNFS from 'react-native-fs';
import {useDispatch} from 'react-redux';

import {getPackageFolderName, getPreparedProjectName} from './preparedProjects.helpers';
import useDevice from '../../../services/device/useDevice';
import {APP_DIRECTORIES} from '../../../services/files/directories.constants';
import {useAutoSaveNow} from '../../../services/files/useAutoSave';
import useImport from '../../../services/files/useImport';
import {getDeviceIdHeader} from '../../../services/network/serverRequests.helpers';
import useServerRequests from '../../../services/network/useServerRequests';
import {isEmpty} from '../../../shared/helpers';
import alert from '../../../shared/ui/alert';
import {MODAL_TRANSITION_DELAY} from '../../../shared/ui/modals/modal.constants';
import {store} from '../../../store/ConfigureStore';
import {
  addedStatusMessage,
  clearedStatusMessages,
  resetMapImportProgress,
  setIsProjectLoadSelectionModalVisible,
  setIsStatusMessagesModalVisible,
  setLoadingStatus,
  setMapImportProgress,
  setStatusMessageModalTitle,
} from '../../home/home.slice';
import {setPreparedProjectInstalled} from '../../user/userProfile.slice';

// Shared by every caller, so a second tap while a package is installing is ignored
let isInstallInFlight = false;

const usePreparedProjects = () => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {unZipAndCopyImportedData, doesBackupFileExist} = useDevice();
  const {loadProjectFromDevice} = useImport();
  const {autoSaveNow} = useAutoSaveNow();
  const {postPreparedProjectInstalled} = useServerRequests();

  /* Internal Functions */

  const confirmInstallWithoutBackup = () => new Promise((resolve) => {
    alert('Backup Failed',
      'The current project could not be saved to the device. Installing will replace it, and any changes not yet'
      + ' uploaded will be lost.',
      [
        {onPress: () => resolve(false), style: 'cancel', text: 'Cancel'},
        {onPress: () => resolve(true), style: 'destructive', text: 'Install Anyway'},
      ]);
  });

  // The package is the same .zip as "Save and Zip" makes, so it is saved under Projects on Device just as an
  // imported one is
  const downloadAndSavePackage = async (preparedProject, folderName) => {
    const {encoded_login} = store.getState().user;
    const {size, url} = preparedProject.package;
    const zipFile = RNFS.CachesDirectoryPath + '/' + folderName + '.zip';
    let lastPct = -1;
    dispatch(addedStatusMessage('Downloading the project package...'));
    try {
      const res = await RNFS.downloadFile({
        fromUrl: url,
        toFile: zipFile,
        headers: {Authorization: 'Basic ' + encoded_login, ...getDeviceIdHeader(url)},
        progressInterval: 250,
        progress: ({bytesWritten, contentLength}) => {
          const total = contentLength > 0 ? contentLength : size;
          if (!total) return;
          const pct = Math.min(100, Math.round(bytesWritten / total * 100));
          if (pct !== lastPct) {
            lastPct = pct;
            dispatch(setMapImportProgress({progress: pct / 100, label: 'Downloading project package...'}));
          }
        },
      }).promise;
      if (res.statusCode !== 200) throw new Error('Could not download the package. Status code: ' + res.statusCode);
      dispatch(resetMapImportProgress());
      dispatch(addedStatusMessage('Unzipping the project package...'));
      await unZipAndCopyImportedData({localUri: zipFile, name: folderName + '.zip'});
    }
    finally {
      dispatch(resetMapImportProgress());
      if (await RNFS.exists(zipFile)) await RNFS.unlink(zipFile);
      // Android stages an imported zip here first; this one has served its purpose
      const androidCopy = APP_DIRECTORIES.EXPORT_FILES_ANDROID + folderName + '.zip';
      if (Platform.OS === 'android' && await RNFS.exists(androidCopy)) await RNFS.unlink(androidCopy);
    }
  };

  const markInstalled = async (preparedProject) => {
    const {id, package: {version}} = preparedProject;
    try {
      await postPreparedProjectInstalled(id, version);
      dispatch(setPreparedProjectInstalled({id, version}));
    }
    catch (err) {
      console.error('Error marking the prepared project installed', err);
      dispatch(addedStatusMessage('The project is installed, but the server could not be told. You may be asked'
        + ' to install it again the next time you sign in.'));
    }
  };

  const confirmOpen = projectName => new Promise((resolve) => {
    const isProjectOpen = !isEmpty(store.getState().project.project);
    alert(`Open ${projectName}?`,
      isProjectOpen ? 'It replaces the open project. A backup of that one is saved to the device first.' : '',
      [
        {onPress: () => resolve(false), style: 'cancel', text: 'Not Now'},
        {onPress: () => resolve(true), text: 'Open'},
      ]);
  });

  // Opening a package replaces the open project, so that is backed up first, as a server download does
  const openPackageFolder = async (folderName) => {
    const {hasFailed} = await autoSaveNow();
    if (hasFailed && !await confirmInstallWithoutBackup()) {
      dispatch(addedStatusMessage('Not opened. The current project is still open.'));
      return;
    }
    await loadProjectFromDevice(folderName);
  };

  const showStatusModal = async (projectName) => {
    if (store.getState().home.isProjectLoadSelectionModalVisible) {
      dispatch(setIsProjectLoadSelectionModalVisible(false));
    }
    // An alert or the project-load modal is going away right now, and on iOS presenting the status modal in the
    // same beat trips UIViewControllerHierarchyInconsistency (see OpenProject). Let it finish first.
    if (Platform.OS === 'ios') await new Promise(resolve => setTimeout(resolve, MODAL_TRANSITION_DELAY));
    dispatch(clearedStatusMessages());
    dispatch(setStatusMessageModalTitle(projectName));
    dispatch(setIsStatusMessagesModalVisible(true));
    dispatch(setLoadingStatus({view: 'modal', bool: true}));
  };

  const reportFailure = (err, action) => {
    console.error(`Error ${action} the prepared project`, err);
    dispatch(addedStatusMessage(`${action === 'opening' ? 'Open' : 'Install'} Failed!\n\n${err?.message || err}`));
    // Signing in with no project open, the welcome screen was closed for this, so give it back. It renders as a
    // View, so it waits beneath the status modal until that is closed.
    if (isEmpty(store.getState().project.project)) dispatch(setIsProjectLoadSelectionModalVisible(true));
  };

  /* Exported Functions */

  // Installs as if the .zip had been imported by hand, then opens it, or with shouldAskToOpen asks first. A
  // project already open with Spots is never replaced by its own package (a newer version, say): the package is
  // saved beside it under Projects on Device.
  const installPreparedProject = async (preparedProject, {shouldAskToOpen = false} = {}) => {
    if (isInstallInFlight) return console.warn('A prepared project is already installing.');
    isInstallInFlight = true;
    const projectName = getPreparedProjectName(preparedProject);
    const folderName = getPackageFolderName(preparedProject);
    try {
      const {project: {project}, spot: {spots}} = store.getState();
      const isOpenWithData = String(project?.id) === String(preparedProject.project_id) && !isEmpty(spots);

      await showStatusModal(projectName);
      if (await doesBackupFileExist(folderName)) {
        dispatch(addedStatusMessage('This package is already saved on the device.'));
      }
      else await downloadAndSavePackage(preparedProject, folderName);

      if (isOpenWithData) {
        dispatch(addedStatusMessage(`The newer package was saved to Projects on Device as ${folderName}.`
          + '\n\nThe open project already has Spots, so it was not replaced.'));
      }
      else if (shouldAskToOpen) {
        dispatch(setLoadingStatus({view: 'modal', bool: false}));
        dispatch(addedStatusMessage(`Saved to Projects on Device as ${folderName}.`));
        if (await confirmOpen(projectName)) {
          dispatch(setLoadingStatus({view: 'modal', bool: true}));
          await openPackageFolder(folderName);
        }
      }
      else await openPackageFolder(folderName);

      await markInstalled(preparedProject);
    }
    catch (err) {
      reportFailure(err, 'installing');
    }
    finally {
      isInstallInFlight = false;
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
    }
  };

  // Opens the installed package already saved under Projects on Device, after asking, with no download
  const openSavedPreparedProject = async (preparedProject) => {
    if (isInstallInFlight) return console.warn('A prepared project is already installing.');
    const projectName = getPreparedProjectName(preparedProject);
    if (!await confirmOpen(projectName)) return;
    isInstallInFlight = true;
    try {
      await showStatusModal(projectName);
      await openPackageFolder(getPackageFolderName(preparedProject, preparedProject.package.installed_version));
    }
    catch (err) {
      reportFailure(err, 'opening');
    }
    finally {
      isInstallInFlight = false;
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
    }
  };

  return {
    installPreparedProject,
    openSavedPreparedProject,
  };
};

export default usePreparedProjects;
