import {useRef} from 'react';
import {Animated, Easing, Platform} from 'react-native';

import {useDispatch} from 'react-redux';

import {setIsMainMenuPanelVisible} from './home.slice';
import {MAIN_MENU_DRAWER_WIDTH, NOTEBOOK_DRAWER_WIDTH, SMALL_SCREEN} from '../../shared/styles.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import {setIsNotebookPanelVisible, setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/page.constants';

// Animations for Drawers & Keyboard
const useHomeAnimations = ({navigation}) => {

  const dispatch = useDispatch();

  const animatedValueLeftSide = useRef(new Animated.Value(0)).current;
  const animatedValueMainMenuDrawer = useRef(new Animated.Value(-MAIN_MENU_DRAWER_WIDTH)).current;
  const animatedValueNotebookDrawer = useRef(new Animated.Value(NOTEBOOK_DRAWER_WIDTH)).current;
  const animatedValueRightSide = useRef(new Animated.Value(0)).current;
  const animatedValueTextInputs = useRef(new Animated.Value(0)).current;

  const animateLeftSide = {transform: [{translateX: animatedValueLeftSide}]};
  const animateMainMenuDrawer = {transform: [{translateX: animatedValueMainMenuDrawer}]};
  const animateNotebookDrawer = {transform: [{translateX: animatedValueNotebookDrawer}]};
  const animateRightSide = {transform: [{translateX: animatedValueRightSide}]};
  const animateTextInputs = {transform: [{translateY: animatedValueTextInputs}]};

  // Used to animate open and close of Settings Panel and Notebook Panel
  const animateDrawer = (animatedState, toValue) => {
    Animated.timing(animatedState, {
      toValue: toValue,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const closeMainMenuPanel = () => {
    console.log('Closing Main Menu Panel...');
    dispatch(setIsMainMenuPanelVisible(false));
    dispatch(setMenuSelectionPage({name: null}));
    SMALL_SCREEN && dispatch(setSidePanelVisible({bool: false}));
    animateDrawer(animatedValueMainMenuDrawer, -MAIN_MENU_DRAWER_WIDTH);
    animateDrawer(animatedValueLeftSide, 0);
  };

  const closeNotebookPanel = () => {
    console.log('Closing Notebook Panel...');
    animateDrawer(animatedValueNotebookDrawer, NOTEBOOK_DRAWER_WIDTH);
    animateDrawer(animatedValueRightSide, 0);
    setTimeout(() => dispatch(setIsNotebookPanelVisible(false)), 1000);
  };

  const openMainMenuPanel = () => {
    console.log('Opening Main Menu Panel...');
    dispatch(setIsMainMenuPanelVisible(true));
    animateDrawer(animatedValueMainMenuDrawer, 0);
    animateDrawer(animatedValueLeftSide, MAIN_MENU_DRAWER_WIDTH);
  };

  const openNotebookPanel = (pageView) => {
    console.log('Opening Notebook Panel...');
    dispatch(setNotebookPageVisible(pageView || PAGE_KEYS.OVERVIEW));
    dispatch(setIsNotebookPanelVisible(true));
    animateDrawer(animatedValueNotebookDrawer, 0);
    animateDrawer(animatedValueRightSide, -NOTEBOOK_DRAWER_WIDTH);
    if (SMALL_SCREEN) {
      navigation.navigate('HomeScreen', {screen: 'Notebook'});
      closeMainMenuPanel();
    }
  };

  return {
    animateLeftSide: animateLeftSide,
    animateMainMenuDrawer: animateMainMenuDrawer,
    animateNotebookDrawer: animateNotebookDrawer,
    animateRightSide: animateRightSide,
    animateTextInputs: animateTextInputs,
    closeMainMenuPanel: closeMainMenuPanel,
    closeNotebookPanel: closeNotebookPanel,
    openMainMenuPanel: openMainMenuPanel,
    openNotebookPanel: openNotebookPanel,
  };
};

export default useHomeAnimations;
