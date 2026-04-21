import React, {useEffect, useRef} from 'react';
import {Animated, Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';
import {useDispatch, useSelector} from 'react-redux';

import Home from './Home';
import {setIsProjectLoadSelectionModalVisible} from './home.slice';
import homeStyles from './home.style';
import OverlaysContainer from './OverlaysContainer';
import useHomeAnimations from './useHomeAnimations';
import useHomeContainer from './useHomeContainer';
import useDevice from '../../services/useDevice';
import {isEmpty} from '../../shared/Helpers';
import MainMenuPanel from '../main-menu-panel/MainMenuPanel';
import settingPanelStyles from '../main-menu-panel/mainMenuPanel.styles';

const HomeContainer = ({navigation, route}) => {
  console.log('Rendering HomeContainer...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const currentProjectId = useSelector(state => state.project.project?.id);
  const {email, name} = useSelector(state => state.user);
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);

  const {createProjectDirectories} = useDevice();
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
  } = useHomeAnimations({navigation});

  const mapComponentRef = useRef(null);
  const {openSpotInNotebook, zoomToCurrentLocation} = useHomeContainer({mapComponentRef, openNotebookPanel});

  /* Side Effects */

  useEffect(() => {
    if (isEmpty(currentProjectId) || Platform.OS === 'web') dispatch(setIsProjectLoadSelectionModalVisible(true));
    if (Platform.OS !== 'web') {
      createProjectDirectories().catch(err => console.error('Error creating app directories', err));
    }
  }, []);

  useEffect(() => {
    console.log('UE HomeContainer', '[navigation, route.params]', route.params);
    const unsubscribe = navigation.addListener('focus', () => {
      route?.params?.pageKey === 'overview' && openNotebookPanel(route.params.pageKey);
    });
    return () => {
      // console.log('Navigation Unsubscribed');
      return unsubscribe;
    };
  }, [navigation, route.params]);

  useEffect(() => {
    // console.log('UE HomeContainer [user]', email);
    if (email && name) Sentry.setUser({'email': email, 'username': name});
  }, [email, name]);

  /* View */

  return (
    <Animated.View style={[homeStyles.container, animateTextInputs]}>
      <Home
        animateLeftSide={animateLeftSide}
        animateNotebookDrawer={animateNotebookDrawer}
        animateRightSide={animateRightSide}
        closeMainMenuPanel={closeMainMenuPanel}
        closeNotebookPanel={closeNotebookPanel}
        openMainMenuPanel={openMainMenuPanel}
        openNotebookPanel={openNotebookPanel}
        openSpotInNotebook={openSpotInNotebook}
        ref={mapComponentRef}
        zoomToCurrentLocation={zoomToCurrentLocation}
      />
      <OverlaysContainer
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
    </Animated.View>
  );
};

export default HomeContainer;
