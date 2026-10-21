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
                           confirmEndMapEditing,
                           endMapEditing,
                           isMapEditing,
                           mapMode,
                           openMainMenuPanel,
                           openNotebookPanel,
                           openSpotInNotebook,
                           setMapMode,
                           zoomToCurrentLocation,
                         }, mapComponentRef) => {
  console.log('Rendering Home...');

  const {
    dialogs,
    distance,
    endMeasurement,
    handleHomeAction,
    handleHomeActionFromMenu,
    hasDrawTools,
    isCreateToolsDisabled,
    onCancel,
    onEndDrawPressed,
    selectingMode,
    setDistance,
    setMapModeToEdit,
    toggleDialog,
  } = useHome({
    closeMainMenuPanel,
    closeNotebookPanel,
    confirmEndMapEditing,
    endMapEditing,
    isMapEditing,
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
          confirmEndMapEditing={confirmEndMapEditing}
          dialogs={dialogs}
          distance={distance}
          endMeasurement={endMeasurement}
          handleHomeAction={handleHomeAction}
          handleHomeActionFromMenu={handleHomeActionFromMenu}
          hasDrawTools={hasDrawTools}
          isCreateToolsDisabled={isCreateToolsDisabled}
          isMapEditing={isMapEditing}
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
          toggleDialog={toggleDialog}
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
        confirmEndMapEditing={confirmEndMapEditing}
        dialogs={dialogs}
        distance={distance}
        endMeasurement={endMeasurement}
        handleHomeAction={handleHomeAction}
        handleHomeActionFromMenu={handleHomeActionFromMenu}
        hasDrawTools={hasDrawTools}
        isCreateToolsDisabled={isCreateToolsDisabled}
        isMapEditing={isMapEditing}
        mapMode={mapMode}
        onCancel={onCancel}
        onEndDrawPressed={onEndDrawPressed}
        openMainMenuPanel={openMainMenuPanel}
        openNotebookPanel={openNotebookPanel}
        ref={mapComponentRef}
        selectingMode={selectingMode}
        setDistance={setDistance}
        setMapModeToEdit={setMapModeToEdit}
        toggleDialog={toggleDialog}
      />
    );
  }
});

export default Home;
