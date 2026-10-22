import React, {useEffect, useRef} from 'react';
import {Animated, Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';
import {useDispatch, useSelector} from 'react-redux';

import Home from './Home';
import {setIsProjectLoadSelectionModalVisible} from './home.slice';
import homeStyles from './home.styles';
import ModalsContainer from './ModalsContainer';
import useHomeAnimations from './useHomeAnimations';
import useHomeContainer from './useHomeContainer';
import useDevice from '../../services/device/useDevice';
import {isEmpty} from '../../shared/helpers';
import UnsavedChangesModal from '../../shared/ui/modals/UnsavedChangesModal';
import MainMenuPanel from '../main-menu-panel/MainMenuPanel';
import settingPanelStyles from '../main-menu-panel/mainMenuPanel.styles';
import useMapMode from '../maps/useMapMode';
import {LeavePageContext} from '../notebook-panel/LeavePageContext';
import useLeavePage from '../notebook-panel/useLeavePage';

const HomeContainer = ({navigation, route}) => {
  console.log('Rendering HomeContainer...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const currentProjectId = useSelector(state => state.project.project?.id);
  const {email, name} = useSelector(state => state.user);
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);

  const mapComponentRef = useRef(null);

  const {createProjectDirectories} = useDevice();
  const {
    confirmEndMapEditing,
    endMapEditing,
    endPromptProps,
    isMapEditing,
    mapMode,
    setMapMode,
  } = useMapMode({mapComponentRef});
  const leavePage = useLeavePage();
  const {
    animateLeftSide,
    animateMainMenuDrawer,
    animateNotebookDrawer,
    animateRightSide,
    animateTextInputs,
    closeMainMenuPanel,
    closeNotebookPanel,
    openMainMenuPanel,
    openNotebookPanel,
  } = useHomeAnimations({confirmEndMapEditing, isMapEditing, leavePage, navigation});
  const {openSpotInNotebook, zoomToCurrentLocation} = useHomeContainer(
    {confirmEndMapEditing, isMapEditing, leavePage, mapComponentRef, openNotebookPanel});

  /* Side Effects */

  useEffect(() => {
    if (isEmpty(currentProjectId) || Platform.OS === 'web') dispatch(setIsProjectLoadSelectionModalVisible(true));
    if (Platform.OS !== 'web') {
      createProjectDirectories().catch(err => console.error('Error creating app directories', err));
    }
  }, []);

  useEffect(() => {
    console.log('UE HomeContainer', '[route.params]', route.params);
    if (route?.params?.pageKey === 'overview') openNotebookPanel(route.params.pageKey);
  }, [route.params]);

  useEffect(() => {
    // console.log('UE HomeContainer [user]', email);
    if (email && name) Sentry.setUser({'email': email, 'username': name});
  }, [email, name]);

  /* View */

  return (
    <LeavePageContext.Provider value={leavePage}>
      <Animated.View style={[homeStyles.container, animateTextInputs]}>
        <Home
          animateLeftSide={animateLeftSide}
          animateNotebookDrawer={animateNotebookDrawer}
          animateRightSide={animateRightSide}
          closeMainMenuPanel={closeMainMenuPanel}
          closeNotebookPanel={closeNotebookPanel}
          confirmEndMapEditing={confirmEndMapEditing}
          endMapEditing={endMapEditing}
          isMapEditing={isMapEditing}
          mapMode={mapMode}
          openMainMenuPanel={openMainMenuPanel}
          openNotebookPanel={openNotebookPanel}
          openSpotInNotebook={openSpotInNotebook}
          ref={mapComponentRef}
          setMapMode={setMapMode}
          zoomToCurrentLocation={zoomToCurrentLocation}
        />
        <ModalsContainer
          closeMainMenuPanel={closeMainMenuPanel}
          closeNotebookPanel={closeNotebookPanel}
          openMainMenuPanel={openMainMenuPanel}
          openNotebookPanel={openNotebookPanel}
          openSpotInNotebook={openSpotInNotebook}
          ref={mapComponentRef}
          zoomToCurrentLocation={zoomToCurrentLocation}
        />
        {!isProjectLoadSelectionModalVisible && (
          <Animated.View style={[settingPanelStyles.settingsDrawer, animateMainMenuDrawer]}>
            <MainMenuPanel
              closeMainMenuPanel={closeMainMenuPanel}
              closeNotebookPanel={closeNotebookPanel}
              navigation={navigation}
              openNotebookPanel={openNotebookPanel}
              openSpotInNotebook={openSpotInNotebook}
              ref={mapComponentRef}
            />
          </Animated.View>
        )}
        <UnsavedChangesModal
          {...endPromptProps}
          headerTitle={'Unsaved Map Edits'}
          message={'Your map edits haven\'t been saved.'}
        />
        <UnsavedChangesModal {...leavePage.leavePromptProps} headerTitle={'Unsaved Changes'}/>
      </Animated.View>
    </LeavePageContext.Provider>
  );
};

export default HomeContainer;
