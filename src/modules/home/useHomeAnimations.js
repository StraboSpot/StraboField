import {useEffect, useRef} from 'react';
import {Animated, Easing, Platform} from 'react-native';

import {useDispatch} from 'react-redux';

import {setIsMainMenuPanelVisible} from './home.slice';
import {MAIN_MENU_WIDTH, NOTEBOOK_WIDTH, SMALL_SCREEN} from '../../shared/styles.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import {canceledIntervalDrag} from '../maps/maps.slice';
import {setIsNotebookPanelVisible, setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';

// Animations for Drawers & Keyboard
const useHomeAnimations = ({navigation}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  /* Local State */

  const animatedValueLeftSide = useRef(new Animated.Value(0)).current;
  const animatedValueMainMenuDrawer = useRef(new Animated.Value(-MAIN_MENU_WIDTH)).current;
  const animatedValueNotebookDrawer = useRef(new Animated.Value(NOTEBOOK_WIDTH)).current;
  const animatedValueRightSide = useRef(new Animated.Value(0)).current;
  const animatedValueTextInputs = useRef(new Animated.Value(0)).current;

  /* Derived Variables */

  const animateLeftSide = {transform: [{translateX: animatedValueLeftSide}]};
  const animateMainMenuDrawer = {transform: [{translateX: animatedValueMainMenuDrawer}]};
  const animateNotebookDrawer = {transform: [{translateX: animatedValueNotebookDrawer}]};
  const animateRightSide = {transform: [{translateX: animatedValueRightSide}]};
  const animateTextInputs = {transform: [{translateY: animatedValueTextInputs}]};

  /* Side Effects */

  // Cleanup: Stop all animations when component unmounts to prevent KERN_PROTECTION_FAILURE crashes
  useEffect(() => {
    return () => {
      animatedValueLeftSide.stopAnimation();
      animatedValueMainMenuDrawer.stopAnimation();
      animatedValueNotebookDrawer.stopAnimation();
      animatedValueRightSide.stopAnimation();
      animatedValueTextInputs.stopAnimation();
    };
  }, []);

  /* Internal Functions */

  // Used to animate open and close of Settings Panel and Notebook Panel
  const animateDrawer = (animatedState, toValue) => {
    Animated.timing(animatedState, {
      toValue: toValue,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  /* Exported Functions */

  const closeMainMenuPanel = () => {
    console.log('Closing Main Menu Panel...');
    dispatch(setIsMainMenuPanelVisible(false));
    dispatch(setMenuSelectionPage({name: null}));
    animateDrawer(animatedValueMainMenuDrawer, -MAIN_MENU_WIDTH);
    animateDrawer(animatedValueLeftSide, 0);
    dispatch(setSidePanelVisible({bool: false, view: 'home'}));
  };

  const closeNotebookPanel = () => {
    console.log('Closing Notebook Panel...');
    animateDrawer(animatedValueNotebookDrawer, NOTEBOOK_WIDTH);
    animateDrawer(animatedValueRightSide, 0);
    setTimeout(() => dispatch(setIsNotebookPanelVisible(false)), 1000);
  };

  const openMainMenuPanel = () => {
    console.log('Opening Main Menu Panel...');
    dispatch(canceledIntervalDrag());
    dispatch(setIsMainMenuPanelVisible(true));
    animateDrawer(animatedValueMainMenuDrawer, 0);
    animateDrawer(animatedValueLeftSide, MAIN_MENU_WIDTH);
  };

  const openNotebookPanel = (pageView) => {
    console.log('Opening Notebook Panel...');
    dispatch(canceledIntervalDrag());
    dispatch(setNotebookPageVisible(pageView || PAGE_KEYS.OVERVIEW));
    dispatch(setIsNotebookPanelVisible(true));
    animateDrawer(animatedValueNotebookDrawer, 0);
    animateDrawer(animatedValueRightSide, -NOTEBOOK_WIDTH);
    if (SMALL_SCREEN) {
      navigation.navigate('HomeScreen', {screen: 'Notebook'});
      closeMainMenuPanel();
    }
  };

  return {
    animateLeftSide,
    animateMainMenuDrawer,
    animateNotebookDrawer,
    animateRightSide,
    animateTextInputs,
    closeMainMenuPanel,
    closeNotebookPanel,
    openMainMenuPanel,
    openNotebookPanel,
  };
};

export default useHomeAnimations;
