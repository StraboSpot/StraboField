import React, {useCallback} from 'react';
import {View} from 'react-native';

import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';

import {setIsNotebookPanelVisible} from './notebook.slice';
import notebookStyles from './notebook.styles';
import NotebookContent from './NotebookContent';
import {SMALL_SCREEN} from '../../shared/styles.constants';

const NotebookPanel = ({closeNotebookPanel, createDefaultGeom, openMainMenuPanel, zoomToSpots}) => {
  console.log('Rendering NotebookPanel...');

  const dispatch = useDispatch();

  const isNotebookPanelVisible = useSelector(state => state.notebook.isNotebookPanelVisible);
  const isFocused = useIsFocused();

  useFocusEffect(useCallback(() => {
      if (SMALL_SCREEN) dispatch(setIsNotebookPanelVisible(true));
      return () => {
        if (SMALL_SCREEN) dispatch(setIsNotebookPanelVisible(false));
      };
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
