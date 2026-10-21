import React from 'react';
import {Animated} from 'react-native';

import {useSelector} from 'react-redux';

import MainMenuButton from './MainMenuButton';
import MapActionButtons from './MapActionButtons';
import UserLocationButton from './UserLocationButton';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {HOME_ACTIONS} from '../home.constants';
import homeStyles from '../home.styles';

const LeftSideButtons = ({
                           animateLeftSide,
                           closeMainMenuPanel,
                           handleHomeAction,
                           handleHomeActionFromMapMenu,
                           mapMenus,
                           openMainMenuPanel,
                           toggleMapMenu,
                           zoomToCustomMap,
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
          handleHomeActionFromMapMenu={handleHomeActionFromMapMenu}
          mapMenus={mapMenus}
          toggleMapMenu={toggleMapMenu}
          zoomToCustomMap={zoomToCustomMap}
        />
      </Animated.View>

      <Animated.View style={[homeStyles.bottomLeftIcons, animateLeftSide]}>
        <UserLocationButton handleHomeAction={handleHomeAction}/>

        {currentImageBasemap && (
          <IconButton
            onPress={() => handleHomeAction(HOME_ACTIONS.CLOSE_IMAGE_BASEMAP)}
            source={require('../../../assets/icons/Close.png')}
          />
        )}
        {stratSection && (
          <IconButton
            onPress={() => handleHomeAction(HOME_ACTIONS.CLOSE_STRAT_SECTION)}
            source={require('../../../assets/icons/Close.png')}
          />
        )}
      </Animated.View>
    </>
  );
};

export default LeftSideButtons;
