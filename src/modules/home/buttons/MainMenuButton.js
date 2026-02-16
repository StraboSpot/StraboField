import React from 'react';

import {useSelector} from 'react-redux';

import IconButton from '../../../shared/ui/buttons/IconButton';

const MainMenuButton = ({closeMainMenuPanel, openMainMenuPanel}) => {
  /* Data Hooks / State */

  const isMainMenuPanelVisible = useSelector(state => state.home.isMainMenuPanelVisible);

  /* Logic Helpers */

  const toggleHomeDrawer = () => {
    if (isMainMenuPanelVisible) closeMainMenuPanel();
    else openMainMenuPanel();
  };

  /* View */

  return (
    <IconButton
      onPress={toggleHomeDrawer}
      source={isMainMenuPanelVisible ? require('../../../assets/icons/HomeButton_pressed.png')
        : require('../../../assets/icons/HomeButton.png')}
    />
  );
};

export default MainMenuButton;
