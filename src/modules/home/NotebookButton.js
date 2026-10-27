import React, {useContext} from 'react';

import {useSelector} from 'react-redux';

import IconButton from '../../shared/ui/buttons/IconButton';
import {LeavePageContext} from '../notebook-panel/LeavePageContext';

const NotebookButton = ({closeNotebookPanel, openNotebookPanel}) => {
  /* Data Hooks */

  const isNotebookPanelVisible = useSelector(state => state.notebook.isNotebookPanelVisible);
  const {confirmLeavePage, hasUnsavedPageChanges} = useContext(LeavePageContext);

  /* Logic Helpers */

  const toggleNotebookPanel = async () => {
    if (!isNotebookPanelVisible) openNotebookPanel();
    else if (!hasUnsavedPageChanges() || await confirmLeavePage()) closeNotebookPanel();
  };

  /* View */

  return (
    <IconButton
      onPress={toggleNotebookPanel}
      source={isNotebookPanelVisible
        ? require('../../assets/icons/NotebookViewButton_pressed.png')
        : require('../../assets/icons/NotebookViewButton.png')}
    />
  );
};

export default NotebookButton;
