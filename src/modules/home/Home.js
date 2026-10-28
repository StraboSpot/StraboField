import React, {forwardRef} from 'react';
import {Animated} from 'react-native';

import homeStyles from './home.styles';
import HomeView from './HomeView';
import HomeViewSmallScreen from './HomeViewSmallScreen';
import useHome from './useHome';
import {SMALL_SCREEN} from '../../shared/styles.constants';

const Home = forwardRef(({
                           animateLeftSide,
                           animateNotebookDrawer,
                           animateRightSide,
                           closeMainMenuPanel,
                           closeNotebookPanel,
                           mapMode,
                           openMainMenuPanel,
                           openNotebookPanel,
                           openSpotInNotebook,
                           setMapMode,
                           zoomToCurrentLocation,
                         }, mapComponentRef) => {
  console.log('Rendering Home...');

  const {
    distance,
    endMeasurement,
    handleHomeAction,
    handleHomeActionFromMapMenu,
    hasDrawTools,
    isCreateToolsDisabled,
    mapMenus,
    onCancel,
    onEndDrawPressed,
    selectingMode,
    setDistance,
    setMapModeToEdit,
    toggleMapMenu,
  } = useHome({
    closeMainMenuPanel,
    closeNotebookPanel,
    mapComponentRef,
    mapMode,
    openNotebookPanel,
    setMapMode,
    zoomToCurrentLocation,
  });

  if (SMALL_SCREEN) {
    return (
      <Animated.View style={[homeStyles.container, animateLeftSide]}>
        <HomeViewSmallScreen
          closeMainMenuPanel={closeMainMenuPanel}
          closeNotebookPanel={closeNotebookPanel}
          distance={distance}
          endMeasurement={endMeasurement}
          handleHomeAction={handleHomeAction}
          handleHomeActionFromMapMenu={handleHomeActionFromMapMenu}
          hasDrawTools={hasDrawTools}
          isCreateToolsDisabled={isCreateToolsDisabled}
          mapMenus={mapMenus}
          mapMode={mapMode}
          onCancel={onCancel}
          onEndDrawPressed={onEndDrawPressed}
          openMainMenuPanel={openMainMenuPanel}
          openNotebookPanel={openNotebookPanel}
          openSpotInNotebook={openSpotInNotebook}
          ref={mapComponentRef}
          selectingMode={selectingMode}
          setDistance={setDistance}
          setMapModeToEdit={setMapModeToEdit}
          toggleMapMenu={toggleMapMenu}
        />
      </Animated.View>
    );
  }
  else {
    return (
      <HomeView
        animateLeftSide={animateLeftSide}
        animateNotebookDrawer={animateNotebookDrawer}
        animateRightSide={animateRightSide}
        closeMainMenuPanel={closeMainMenuPanel}
        closeNotebookPanel={closeNotebookPanel}
        distance={distance}
        endMeasurement={endMeasurement}
        handleHomeAction={handleHomeAction}
        handleHomeActionFromMapMenu={handleHomeActionFromMapMenu}
        hasDrawTools={hasDrawTools}
        isCreateToolsDisabled={isCreateToolsDisabled}
        mapMenus={mapMenus}
        mapMode={mapMode}
        onCancel={onCancel}
        onEndDrawPressed={onEndDrawPressed}
        openMainMenuPanel={openMainMenuPanel}
        openNotebookPanel={openNotebookPanel}
        ref={mapComponentRef}
        selectingMode={selectingMode}
        setDistance={setDistance}
        setMapModeToEdit={setMapModeToEdit}
        toggleMapMenu={toggleMapMenu}
      />
    );
  }
});

export default Home;
