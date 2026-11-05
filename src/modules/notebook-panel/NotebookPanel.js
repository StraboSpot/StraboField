import React, {useCallback, useContext, useRef} from 'react';
import {BackHandler, View} from 'react-native';

import {useFocusEffect, useIsFocused, useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';

import {LeavePageContext} from './LeavePageContext';
import {setIsNotebookPanelVisible} from './notebook.slice';
import notebookStyles from './notebook.styles';
import NotebookContent from './NotebookContent';
import {SMALL_SCREEN} from '../../shared/styles.constants';

const NotebookPanel = ({closeNotebookPanel, createDefaultGeom, openMainMenuPanel, zoomToSpots}) => {
  console.log('Rendering NotebookPanel...');

  const dispatch = useDispatch();

  const isNotebookPanelVisible = useSelector(state => state.notebook.isNotebookPanelVisible);
  const isFocused = useIsFocused();
  const leavePage = useContext(LeavePageContext);
  const navigation = useNavigation();

  // The back handler is added once per focus, so it reads the gate from this render rather than the first
  const leavePageRef = useRef(leavePage);
  leavePageRef.current = leavePage;

  useFocusEffect(useCallback(() => {
      if (SMALL_SCREEN) dispatch(setIsNotebookPanelVisible(true));
      return () => {
        if (SMALL_SCREEN) dispatch(setIsNotebookPanelVisible(false));
      };
    }, []),
  );

  // On a phone, Android's back button takes the Notebook tab back to the Map tab, which closes the page on it
  useFocusEffect(useCallback(() => {
      if (!SMALL_SCREEN) return undefined;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        const {confirmLeavePage, hasUnsavedPageChanges} = leavePageRef.current;
        if (!hasUnsavedPageChanges()) return false;
        confirmLeavePage().then(isLeaving => isLeaving && navigation.navigate('Map'));
        return true;
      });
      return () => subscription.remove();
    }, []),
  );

  // On a phone the focused tab is on screen even after something (e.g. opening a project) clears the flag.
  if (isNotebookPanelVisible || (SMALL_SCREEN && isFocused)) {
    return (
      <View style={notebookStyles.notebookPanel}>
        <NotebookContent
          closeNotebookPanel={closeNotebookPanel}
          createDefaultGeom={createDefaultGeom}
          openMainMenuPanel={openMainMenuPanel}
          zoomToSpots={zoomToSpots}
        />
      </View>
    );
  }
};

export default NotebookPanel;
