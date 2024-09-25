import React from 'react';
import {Text, View} from 'react-native';

import {Button} from 'react-native-elements';
import {useDispatch, useSelector} from 'react-redux';

import useDownload from '../../../services/useDownload';
import useImport from '../../../services/useImport';
import {isEmpty} from '../../../shared/Helpers';
import {BLUE} from '../../../shared/styles.constants';
import StatusDialogBox from '../../../shared/ui/StatusDialogBox';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage} from '../../main-menu-panel/mainMenuPanel.slice';
import {setSelectedProject} from '../../project/projects.slice';
import {setIsStatusMessagesModalVisible} from '../home.slice';
import overlayStyles from '../overlays/overlay.styles';

const StatusModal = ({exportProject, openMainMenuPanel, openUrl, visible}) => {
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
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE.ACTIVE_PROJECTS}));
      const res = await loadProjectFromDevice(selectedProject.project.fileName);
      console.log('Done loading project', res);
    }
    else if (selectedProject.source === 'server') {
      console.log('FROM SERVER', selectedProject.project);
      dispatch(setSelectedProject({source: '', project: ''}));
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE.ACTIVE_PROJECTS}));
      await initializeDownload(selectedProject.project);
    }
    else {
      dispatch(setIsStatusMessagesModalVisible(false));
      openMainMenuPanel();
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE.ACTIVE_PROJECTS}));
    }
  };

  return (
    <StatusDialogBox
      title={'Status'}
      isVisible={visible || isStatusMessagesModalVisible}
      closeModal={() => dispatch(setIsStatusMessagesModalVisible(false))}
      showConfirmButton={!isModalLoading && selectedProject.source === ''}
      onConfirmPress={() => dispatch(setIsStatusMessagesModalVisible(false))}
    >
      <View>
        {isModalLoading && (
          <LottieAnimations
            type={'loadingFile'}
            show={isModalLoading}
            doesLoop={isModalLoading}
          />
        )}
        <Text style={overlayStyles.statusMessageText}>{statusMessages.join('\n')}</Text>
        {!isModalLoading && <View style={{alignItems: 'center'}}>
          {(selectedProject.source === 'device' || selectedProject.source === 'server') && (
            <Text style={{fontWeight: 'bold', textAlign: 'center'}}>Press Continue to load project</Text>
          )}
          <View style={{flexDirection: 'row'}}>
            <Button
              title={!isEmpty(selectedProject.source) && selectedProject.source !== '' && 'Continue'}
              type={'clear'}
              containerStyle={{padding: 10}}
              onPress={() => getProjectFromSource(selectedProject)}
            />
            {!isEmpty(selectedProject.source) && selectedProject.source !== '' && (
              <Button
                title={'Cancel'}
                containerStyle={{padding: 10}}
                type={'clear'}
                onPress={() => dispatch(setIsStatusMessagesModalVisible(false))}
              />
            )}

          </View>
          {/*{statusMessages.includes('Complete!') && (*/}
          {/*  <Button*/}
          {/*    title={'Export Project?'}*/}
          {/*    containerStyle={{padding: 10}}*/}
          {/*    type={'clear'}*/}
          {/*    onPress={exportProject}*/}
          {/*  />*/}
          {/*)}*/}
          <Button
            titleStyle={overlayStyles.urlText}
            icon={{
              name: 'globe-outline',
              type: 'ionicon',
              size: 15,
              color: BLUE,
            }}
            title={'Visit account at StraboSpot.org'}
            type={'clear'}
            onPress={openUrl}/>
        </View>
        }
      </View>
    </StatusDialogBox>
  );
};

export default StatusModal;
