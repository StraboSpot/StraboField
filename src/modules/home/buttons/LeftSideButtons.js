import React from 'react';
import {Animated} from 'react-native';

import {useSelector} from 'react-redux';

import {AutoBackupButton, MainMenuButton, MapActionButtons, UserLocationButton} from './index';
import IconButton from '../../../shared/ui/buttons/IconButton';
import homeStyles from '../home.style';

const LeftSideButtons = ({
                           animateLeftSide,
                           clickHandler,
                           closeMainMenuPanel,
                           dialogClickHandler,
                           dialogs,
                           openMainMenuPanel,
                           toggleDialog,
                         }) => {
  console.log('Rendering LeftSideButtons...');

  /* Data Hooks */

  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const stratSection = useSelector(state => state.map.stratSection);

  /* View */

  return (
    <>
      <Animated.View style={[homeStyles.homeIconContainer, animateLeftSide]}>
        <MainMenuButton closeMainMenuPanel={closeMainMenuPanel} openMainMenuPanel={openMainMenuPanel}/>
      </Animated.View>

      <Animated.View style={[homeStyles.mapActionsContainer, animateLeftSide]}>
        <MapActionButtons
          dialogClickHandler={dialogClickHandler}
          dialogs={dialogs}
          toggleDialog={toggleDialog}
        />
      </Animated.View>

      <Animated.View style={[homeStyles.bottomLeftIcons, animateLeftSide]}>
        <AutoBackupButton/>
        <UserLocationButton clickHandler={clickHandler}/>

        {currentImageBasemap && (
          <IconButton
            onPress={() => clickHandler('closeImageBasemap')}
            source={require('../../../assets/icons/Close.png')}
          />
        )}
        {stratSection && (
          <IconButton
            onPress={() => clickHandler('closeStratSection')}
            source={require('../../../assets/icons/Close.png')}
          />
        )}
      </Animated.View>
    </>
  );
};

export default LeftSideButtons;
