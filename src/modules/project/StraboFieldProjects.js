import React from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import LoadProjectButtons from './load/LoadProjectButtons';
import useDevice from '../../services/useDevice';
import commonStyles from '../../shared/common.styles';
import {BLUE} from '../../shared/styles.constants';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import SectionDivider from '../../shared/ui/SectionDivider';
import Spacer from '../../shared/ui/Spacer';
import uiStyles from '../../shared/ui/ui.styles';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import LogOut from '../user/LogOut';

const StraboFieldProjects = () => {
  const dispatch = useDispatch();
  const {openURL} = useDevice();

  const importLocationText = Platform.OS === 'ios' ? 'Documents/Strabofield/Distribution'
    : 'Downloads/StraboSpot2/Backups';

  const onDeleteLocalCopy = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.DELETE_PROJECT}));
  };

  const onExportOtherSavedProject = () => {
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.EXPORT_PROJECT}));
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
            <SectionDivider dividerText={'Other Actions with\nLocal Projects on Device'}/>
            <View style={{paddingHorizontal: 10}}>
              <Button
                buttonStyle={commonStyles.standardButton}
                containerStyle={commonStyles.standardButtonContainer}
                onPress={onDeleteLocalCopy}
                title={'Delete'}
                titleStyle={commonStyles.standardButtonText}
                type={'outline'}
              />
              <Button
                buttonStyle={commonStyles.standardButton}
                containerStyle={commonStyles.standardButtonContainer}
                onPress={onExportOtherSavedProject}
                title={Platform.OS === 'ios' ? 'Zip' : 'Export to Zip'}
                titleStyle={commonStyles.standardButtonText}
                type={'outline'}
              />
              {Platform.OS === 'ios' && (
                <View style={{flex: 1, justifyContent: 'flex-end', paddingBottom: 15}}>
                  <View style={{padding: 10, alignItems: 'center'}}>
                    <Text style={{...uiStyles.sectionDividerText, textAlign: 'center'}}>
                      Additional help documents can be found in the Menu -&gt; Help -&gt; Documentation
                    </Text>
                  </View>
                  <Button
                    buttonStyle={commonStyles.standardButton}
                    containerStyle={commonStyles.buttonPadding}
                    icon={{
                      name: 'file-tray-full-outline',
                      type: 'ionicon',
                      color: BLUE,
                    }}
                    iconContainerStyle={{paddingRight: 10}}
                    onPress={() => openURL('ProjectBackups')}
                    title={'View/Edit Files on Device'}
                    titleStyle={commonStyles.standardButtonText}
                    type={'outline'}
                  />
                </View>
              )}
              {Platform.OS === 'android' && (
                <Text style={overlayStyles.statusMessageText}>
                  *The imported project must be a .zip file in the {importLocationText} folder.
                </Text>
              )}
            </View>
          </>
        }
      />
      <LogOut/>
    </>
  );
};

export default StraboFieldProjects;
