import React, {forwardRef} from 'react';
import {Animated} from 'react-native';

import homeStyles from './home.style';
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
                           openMainMenuPanel,
                           openNotebookPanel,
                           openSpotInNotebook,
                           zoomToCurrentLocation,
                         }, mapComponentRef) => {
  console.log('Rendering Home...');

  const {
    clickHandler,
    dialogClickHandler,
    dialogs,
    distance,
    endMeasurement,
    mapMode,
    onCancel,
    onEndDrawPressed,
    selectingMode,
    setDistance,
    setMapModeToEdit,
    toggleDialog,
  } = useHome({closeMainMenuPanel, mapComponentRef, openNotebookPanel, zoomToCurrentLocation});

  if (SMALL_SCREEN) {
    return (
      <Animated.View style={[homeStyles.container, animateLeftSide]}>
        <HomeViewSmallScreen
          clickHandler={clickHandler}
          closeMainMenuPanel={closeMainMenuPanel}
          closeNotebookPanel={closeNotebookPanel}
          dialogClickHandler={dialogClickHandler}
          dialogs={dialogs}
          distance={distance}
          endMeasurement={endMeasurement}
          onCancel={onCancel}
          mapMode={mapMode}
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
        clickHandler={clickHandler}
        closeMainMenuPanel={closeMainMenuPanel}
        closeNotebookPanel={closeNotebookPanel}
        dialogClickHandler={dialogClickHandler}
        dialogs={dialogs}
        distance={distance}
        endMeasurement={endMeasurement}
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
