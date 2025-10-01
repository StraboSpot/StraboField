import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {Button, Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import DownloadProjectPage from './DownloadProjectPage';
import ImportProjectFromZip from './ImportProjectFromZip';
import LoadProjectButtons from './LoadProjectButtons';
import NewProjectForm from './NewProjectForm';
import useResetState from '../../../services/useResetState';
import commonStyles from '../../../shared/common.styles';
import {isEmpty, truncateText} from '../../../shared/Helpers';
import {PRIMARY_BACKGROUND_COLOR} from '../../../shared/styles.constants';
import {setStatusMessageModalTitle} from '../../home/home.slice';
import userStyles from '../../user/user.styles';
import UserProfileAvatar from '../../user/UserProfileAvatar';
import projectStyles from '../project.styles';
import OpenProjectPage from './OpenProjectPage';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';

const InitialProjectLoadModal = ({closeMainMenuPanel, openMainMenuPanel}) => {
  console.log('Rendering InitialProjectLoadModal...');

  const dispatch = useDispatch();
  const statusMessageModalTitle = useSelector(state => state.home.statusMessageModalTitle);
  const isOnline = useSelector(state => state.connections.isOnline);
  const user = useSelector(state => state.user);

  const [displayName, setDisplayName] = useState('');
  const [visibleInitialSection, setVisibleInitialSection] = useState('none');

  const {clearUser} = useResetState();

  const displayFirstName = () => {
    if (user.name && !isEmpty(user.name)) return user.name.split(' ')[0];
    else return 'Guest';
  };

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

  const goBackToMain = () => {
    if (visibleInitialSection !== 'none') {
      setVisibleInitialSection('none');
      dispatch(setStatusMessageModalTitle('Welcome to StraboSpot'));
    }
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

  const renderBackButton = () => {
    return (
      <Button
        containerStyle={{alignItems: 'flex-start'}}
        icon={
          <Icon
            color={'black'}
            iconStyle={projectStyles.buttons}
            name={'arrow-back'}
            size={20}
            type={'ionicon'}
          />
        }
        onPress={goBackToMain}
        title={'Back'}
        titleStyle={commonStyles.standardButtonText}
        type={'clear'}
      />
    );
  };

  const renderSectionView = () => {
    switch (visibleInitialSection) {
      case 'serverProjects':
        return (
          <>
            {renderBackButton()}
            <DownloadProjectPage closeMainMenuPanel={closeMainMenuPanel}/>
          </>
        );
      case 'deviceProjects':
        return (
          <>
            {renderBackButton()}
            <OpenProjectPage/>
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
          <Button
            onPress={clearUser}
            title={user.name ? `Not ${user.name}?` : 'Log in?'}
            titleStyle={{...commonStyles.standardButtonText, fontSize: 10}}
            type={'clear'}
          />
        </View>
      </View>
    );
  };

  return (
    <ModalWrapper
      headerTitle={statusMessageModalTitle}
      overlayStyleOverride={{justifyContent: 'center', height: visibleInitialSection === 'none' ? null : '80%'}}
      showActionButton={false}
      showCancelButton={false}
    >
      {visibleInitialSection === 'none' && renderUserProfile()}
      {renderSectionView()}
    </ModalWrapper>
  );
};

export default InitialProjectLoadModal;
