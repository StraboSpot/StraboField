import React from 'react';

import {useSelector} from 'react-redux';

import IconButton from '../../../shared/ui/IconButton';

const NotebookButton = ({closeNotebookPanel, openNotebookPanel}) => {
  const isNotebookPanelVisible = useSelector(state => state.notebook.isNotebookPanelVisible);

  const toggleNotebookPanel = () => {
    if (isNotebookPanelVisible) closeNotebookPanel();
    else openNotebookPanel();
  };

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
