import React from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import overlayStyles from './overlay.styles';
import StatusDialogBox from './StatusDialogBox';
import {setIsStatusMessagesModalVisible, setLoadingStatus} from '../../../modules/home/home.slice';
import {MAIN_MENU_ITEMS} from '../../../modules/main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage} from '../../../modules/main-menu-panel/mainMenuPanel.slice';
import {setSelectedProject} from '../../../modules/project/projects.slice';
import useDownload from '../../../services/useDownload';
import useImport from '../../../services/useImport';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import {isEmpty} from '../../Helpers';

const StatusModal = ({openMainMenuPanel}) => {
  const dispatch = useDispatch();
  const isModalLoading = useSelector(state => state.home.loading.modal);
  const isStatusMessagesModalVisible = useSelector(state => state.home.isStatusMessagesModalVisible);
  const selectedProject = useSelector(state => state.project.selectedProject) || {};
  const statusMessages = useSelector(state => state.home.statusMessages);

  const {loadProjectFromDevice} = useImport();
  const {initializeDownload} = useDownload();

  const getProjectFromSource = async () => {
    if (selectedProject.source === 'device') {
      console.log('FROM DEVICE', selectedProject.project);
      dispatch(setSelectedProject({source: '', project: ''}));
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.ACTIVE_PROJECTS}));
      dispatch(setLoadingStatus({view: 'modal', bool: true}));
      const res = await loadProjectFromDevice(selectedProject.project.fileName);
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      console.log('Done loading project', res);
    }
    else if (selectedProject.source === 'server') {
      console.log('FROM SERVER', selectedProject.project);
      dispatch(setSelectedProject({source: '', project: ''}));
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.ACTIVE_PROJECTS}));
      await initializeDownload(selectedProject.project);
    }
    else {
      dispatch(setIsStatusMessagesModalVisible(false));
      openMainMenuPanel();
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.ACTIVE_PROJECTS}));
    }
  };

  return (
    <StatusDialogBox
      headerTitle={'Status'}
      isVisible={isStatusMessagesModalVisible}
      onActionPressed={() => dispatch(setIsStatusMessagesModalVisible(false))}
      onCancelPress={() => dispatch(setIsStatusMessagesModalVisible(false))}
      showActionButton={!isModalLoading && selectedProject.source === ''}
      showCancelButton={!isModalLoading && selectedProject.source !== ''}
    >
      <View>
        {isModalLoading && (
          <LottieAnimations
            doesLoop={isModalLoading}
            show={isModalLoading}
            type={'loadingFile'}
          />
        )}
        <Text style={overlayStyles.statusMessageText}>{statusMessages.join('\n')}</Text>
        {!isModalLoading && <View style={{alignItems: 'center'}}>
          {(selectedProject.source === 'device' || selectedProject.source === 'server') && (
            <Text style={{fontWeight: 'bold', textAlign: 'center'}}>Press Continue to load project</Text>
          )}
          <View style={{flexDirection: 'row'}}>
            <Button
              containerStyle={{padding: 10}}
              onPress={() => getProjectFromSource(selectedProject)}
              title={!isEmpty(selectedProject.source) && selectedProject.source !== '' && 'Continue'}
              type={'clear'}
            />
            {!isEmpty(selectedProject.source) && selectedProject.source !== '' && (
              <Button
                containerStyle={{padding: 10}}
                onPress={() => dispatch(setIsStatusMessagesModalVisible(false))}
                title={'Cancel'}
                type={'clear'}
              />
            )}
          </View>
        </View>
        }
      </View>
    </StatusDialogBox>
  );
};

export default StatusModal;
