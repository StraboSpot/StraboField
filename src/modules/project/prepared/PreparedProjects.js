import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import {
  describePackage,
  getPackageFolderName,
  getPreparedProjectName,
  getPreparedProjectStatus,
  getReadyPreparedProjects,
  hasNewerPackage,
  isPreparedProjectInstalled,
} from './preparedProjects.helpers';
import usePreparedProjects from './usePreparedProjects';
import useDevice from '../../../services/device/useDevice';
import commonStyles from '../../../shared/common.styles';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import SectionDivider from '../../../shared/ui/SectionDivider';
import Spacer from '../../../shared/ui/Spacer';
import useIsConnectionAvailable from '../../connections/useConnectionStatus';

// 'field_camp' -> 'Field Camp'. The kind is only shown: every kind installs the same way.
const getKindLabel = kind => kind?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

// Projects prepared for this account on the website, each with a package to install. Shown only in testing mode and
// when there are some, below the ways to load a project in StraboField Projects.
const PreparedProjects = ({closeMainMenuPanel}) => {
  /* Data Hooks */

  const isTestingMode = useSelector(state => state.project.isTestingMode);
  const openProjectId = useSelector(state => state.project.project?.id);
  const preparedProjects = useSelector(state => state.user.prepared_projects);

  const isConnectionAvailable = useIsConnectionAvailable();
  const {doesBackupFileExist} = useDevice();
  const {installPreparedProject, openSavedPreparedProject} = usePreparedProjects();

  /* Local State */

  // Ids of the prepared projects whose installed package is saved under Projects on Device
  const [savedIds, setSavedIds] = useState([]);

  /* Derived Variables */

  const readyPreparedProjects = getReadyPreparedProjects(preparedProjects);

  /* Side Effects */

  useEffect(() => {
    let isCurrent = true;
    const checkSaved = async () => {
      const installed = readyPreparedProjects.filter(p => p.package.installed_version);
      const saved = await Promise.all(
        installed.map(p => doesBackupFileExist(getPackageFolderName(p, p.package.installed_version))));
      if (isCurrent) setSavedIds(installed.filter((p, i) => saved[i]).map(p => p.id));
    };
    checkSaved().catch(err => console.error('Error checking for saved prepared projects', err));
    return () => {
      isCurrent = false;
    };
  }, [preparedProjects, openProjectId]);

  /* Event Handlers */

  const onDownload = (preparedProject, options) => {
    closeMainMenuPanel?.();
    installPreparedProject(preparedProject, options);
  };

  const onOpen = (preparedProject) => {
    closeMainMenuPanel?.();
    openSavedPreparedProject(preparedProject);
  };

  /* Render Functions */

  const renderActions = (preparedProject, {isOpen, isSaved}) => {
    const isInstalled = isPreparedProjectInstalled(preparedProject);
    const isNewer = hasNewerPackage(preparedProject);
    return (
      <>
        {!isOpen && isSaved && <OutlineButton onPress={() => onOpen(preparedProject)} title={'Open'}/>}
        {!isOpen && isInstalled && !isSaved && (
          <OutlineButton
            disabled={!isConnectionAvailable}
            onPress={() => onDownload(preparedProject, {shouldAskToOpen: true})}
            title={'Download Again'}
          />
        )}
        {!isInstalled && (
          <OutlineButton
            disabled={!isConnectionAvailable}
            onPress={() => onDownload(preparedProject)}
            title={'Download and Install'}
          />
        )}
        {/* Saved beside the one installed. Opened in its place, unless that one is open and has Spots. */}
        {isNewer && (isOpen || isSaved) && (
          <OutlineButton
            disabled={!isConnectionAvailable}
            onPress={() => onDownload(preparedProject)}
            title={'Download Newer Version'}
          />
        )}
      </>
    );
  };

  const renderPreparedProject = (preparedProject) => {
    const kindLabel = getKindLabel(preparedProject.kind);
    const state = {
      isOpen: String(openProjectId) === String(preparedProject.project_id),
      isSaved: savedIds.includes(preparedProject.id),
    };
    return (
      <View key={preparedProject.id} style={{paddingHorizontal: 15, paddingVertical: 5}}>
        <Text style={commonStyles.listItemTitle}>{getPreparedProjectName(preparedProject)}</Text>
        <Text style={overlayStyles.statusMessageText}>
          {[kindLabel, describePackage(preparedProject)].filter(Boolean).join(' · ')}
        </Text>
        <Text style={overlayStyles.statusMessageText}>{getPreparedProjectStatus(preparedProject, state)}</Text>
        {renderActions(preparedProject, state)}
      </View>
    );
  };

  /* View */

  if (!isTestingMode || readyPreparedProjects.length === 0) return null;

  return (
    <>
      <Spacer/>
      <SectionDivider dividerText={'Prepared Projects'}/>
      {readyPreparedProjects.map(renderPreparedProject)}
    </>
  );
};

export default PreparedProjects;
