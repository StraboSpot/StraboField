import React from 'react';
import {FlatList, Platform} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import LoadProjectButtons from './load/LoadProjectButtons';
import commonStyles from '../../shared/common.styles';
import SectionDivider from '../../shared/ui/SectionDivider';
import Spacer from '../../shared/ui/Spacer';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import LogOut from '../user/LogOut';

const StraboFieldProjects = () => {
  const dispatch = useDispatch();

  const onDeleteLocalCopy = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.DELETE_LOCAL_PROJECT_COPY}));
  };

  const onExportOtherSavedProject = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.EXPORT_OTHER_SAVED_PROJECT}));
  };

  const onLoadProjectsFromServer = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.DOWNLOAD_PROJECT}));
  };

  const onLoadProjectsFromDevice = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.OPEN_PROJECT}));
  };

  const onLoadProjectsFromDownloadsFolder = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.IMPORT_PROJECT}));
  };

  const onStartNewProject = () => dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.NEW_PROJECT}));

  return (
    <>
      <FlatList
        ListHeaderComponent={
          <>
            <SectionDivider dividerText={'Load a Project'}/>
            <LoadProjectButtons
              onLoadProjectsFromDevice={onLoadProjectsFromDevice}
              onLoadProjectsFromDownloadsFolder={onLoadProjectsFromDownloadsFolder}
              onLoadProjectsFromServer={onLoadProjectsFromServer}
              onStartNewProject={onStartNewProject}
            />
            <Spacer/>
            <Spacer/>
            <SectionDivider dividerText={'Other Saved Local Projects'}/>
            <Button
              title={'Delete'}
              containerStyle={commonStyles.standardButtonContainer}
              buttonStyle={commonStyles.standardButton}
              titleStyle={commonStyles.standardButtonText}
              onPress={onDeleteLocalCopy}
            />
            <Button
              title={Platform.OS === 'ios' ? 'Zip' : 'Export to Zip'}
              containerStyle={commonStyles.standardButtonContainer}
              buttonStyle={commonStyles.standardButton}
              titleStyle={commonStyles.standardButtonText}
              onPress={onExportOtherSavedProject}
            />
          </>
        }
      />
      {Platform.OS !== 'web' && <LogOut/>}
    </>
  );
};

export default StraboFieldProjects;
