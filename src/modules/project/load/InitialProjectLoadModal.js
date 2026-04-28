import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import DownloadProject from './DownloadProject';
import ImportProjectFromZip from './ImportProjectFromZip';
import LoadProjectButtons from './LoadProjectButtons';
import NewProjectForm from './NewProjectForm';
import OpenProject from './OpenProject';
import {isEmpty, truncateText} from '../../../shared/Helpers';
import {PRIMARY_BACKGROUND_COLOR} from '../../../shared/styles.constants';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import useResetState from '../../../store/useResetState';
import {setStatusMessageModalTitle} from '../../home/home.slice';
import userStyles from '../../user/user.styles';
import UserProfileAvatar from '../../user/UserProfileAvatar';
import projectStyles from '../project.styles';

const InitialProjectLoadModal = ({closeMainMenuPanel, closeNotebookPanel, openMainMenuPanel}) => {
  console.log('Rendering InitialProjectLoadModal...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline);
  const statusMessageModalTitle = useSelector(state => state.home.statusMessageModalTitle);
  const user = useSelector(state => state.user);

  const {clearUser} = useResetState();

  /* Local State */

  const [displayName, setDisplayName] = useState('');
  const [visibleInitialSection, setVisibleInitialSection] = useState('none');

  /* Side Effects */

  useEffect(() => {
    setDisplayName(displayFirstName);
    return () => {
      setVisibleInitialSection('none');
      setDisplayName('');
    };
  }, []);

  useEffect(() => {
    console.log('UE InitialProjectLoadModal [isOnline]', isOnline);
    dispatch(setStatusMessageModalTitle('Welcome to StraboSpot'));
  }, [isOnline]);

  /* Event Handlers */

  const handleOnPress = (type) => {
    switch (type) {
      case 'serverProjects':
        setVisibleInitialSection('serverProjects');
        dispatch(setStatusMessageModalTitle('Projects on Server'));
        break;
      case 'deviceProjects':
        setVisibleInitialSection('deviceProjects');
        dispatch(setStatusMessageModalTitle('Projects on Device'));
        break;
      case 'importProject':
        setVisibleInitialSection('importData');
        break;
      case 'project':
        setVisibleInitialSection('project');
        dispatch(setStatusMessageModalTitle('Start New Project'));
        break;
      default:
        setVisibleInitialSection('none');
        dispatch(setStatusMessageModalTitle('Welcome to StraboSpot'));
    }
  };

  /* Logic Helpers */

  const displayFirstName = () => {
    if (user.name && !isEmpty(user.name)) return user.name.split(' ')[0];
    else return 'Guest';
  };

  const goBackToMain = () => {
    if (visibleInitialSection !== 'none') {
      setVisibleInitialSection('none');
      dispatch(setStatusMessageModalTitle('Welcome to StraboSpot'));
    }
  };

  /* Render Functions */

  const renderBackButton = () => {
    return (
      <View style={{alignItems: 'flex-start'}}>
        <ClearButton
          icon={{
            iconStyle: projectStyles.buttons,
            name: 'arrow-back',
            size: 20,
            type: 'ionicon',
          }}
          onPress={goBackToMain}
          title={'Back'}
        />
      </View>
    );
  };

  const renderLoadProjectButtons = () => {
    return (
      <LoadProjectButtons
        onLoadProjectsFromDevice={() => handleOnPress('deviceProjects')}
        onLoadProjectsFromDownloadsFolder={() => handleOnPress('importProject')}
        onLoadProjectsFromServer={() => handleOnPress('serverProjects')}
        onStartNewProject={() => handleOnPress('project')}
      />
    );
  };

  const renderSectionView = () => {
    switch (visibleInitialSection) {
      case 'serverProjects':
        return (
          <View style={{flex: 1}}>
            {renderBackButton()}
            <DownloadProject closeMainMenuPanel={closeMainMenuPanel} closeNotebookPanel={closeNotebookPanel}/>
          </View>
        );
      case 'deviceProjects':
        return (
          <>
            {renderBackButton()}
            <OpenProject closeMainMenuPanel={closeMainMenuPanel} closeNotebookPanel={closeNotebookPanel}/>
          </>
        );
      case 'project':
        return (
          <>
            {renderBackButton()}
            <View style={{backgroundColor: PRIMARY_BACKGROUND_COLOR, flex: 1}}>
              <NewProjectForm openMainMenuPanel={openMainMenuPanel}/>
            </View>
          </>
        );
      case 'importData':
        return (
          <>
            {renderBackButton()}
            <ImportProjectFromZip
              goBackToMain={() => goBackToMain()}
              openMainMenuPanel={openMainMenuPanel}
            />
          </>
        );
      default:
        return renderLoadProjectButtons();
    }
  };

  const renderUserProfile = () => {
    return (
      <View style={userStyles.initialProjectLoadProfileContainer}>
        {user.name && <UserProfileAvatar size={80}/>}
        <View style={userStyles.initialProjectLoadProfileHeaderContainer}>
          <Text style={userStyles.initialProjectLoadProfileHeaderText}>Hello, {displayName}!</Text>
          {user.email && <Text>Signed in as {truncateText(user.email, 15)}</Text>}
          <ClearButton
            onPress={clearUser}
            title={user.name ? `Not ${user.name}?` : 'Log in?'}
          />
        </View>
      </View>
    );
  };

  /* View */

  return (
    <ModalWrapper
      headerTitle={statusMessageModalTitle}
      overlayStyleOverride={{justifyContent: 'center', height: visibleInitialSection === 'none' ? 'auto' : '80%'}}
      showActionButton={false}
      showCancelButton={false}
    >
      {visibleInitialSection === 'none' && renderUserProfile()}
      {renderSectionView()}
    </ModalWrapper>
  );
};

export default InitialProjectLoadModal;
