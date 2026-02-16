import React from 'react';

import {useSelector} from 'react-redux';

import IconButton from '../../../shared/ui/buttons/IconButton';

const NotebookButton = ({closeNotebookPanel, openNotebookPanel}) => {
  /* Data Hooks / State */

  const isNotebookPanelVisible = useSelector(state => state.notebook.isNotebookPanelVisible);

  /* Event Handlers */

  const toggleNotebookPanel = () => {
    if (isNotebookPanelVisible) closeNotebookPanel();
    else openNotebookPanel();
  };

  /* View */

  return (
    <IconButton
      onPress={toggleNotebookPanel}
      source={isNotebookPanelVisible
        ? require('../../../assets/icons/NotebookViewButton_pressed.png')
        : require('../../../assets/icons/NotebookViewButton.png')}
    />
  );
};

export default NotebookButton;
