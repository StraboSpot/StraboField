import React, {forwardRef} from 'react';
import {Animated} from 'react-native';

import {LeftSideButtons, RightSideButtons} from './buttons';
import DeviceInfo from './DeviceInfo';
import MapContainer from '../maps/MapContainer';
import OfflineMapLabel from '../maps/offline-maps/OfflineMapsLabel';
import notebookStyles from '../notebook-panel/notebook.styles';
import NotebookPanel from '../notebook-panel/NotebookPanel';
import VersionCheckLabel from '../version-check/VersionCheckLabel';

const HomeView = forwardRef(({
                               animateLeftSide,
                               animateNotebookDrawer,
                               animateRightSide,
                               clickHandler,
                               closeMainMenuPanel,
                               closeNotebookPanel,
                               dialogClickHandler,
                               dialogs,
                               distance,
                               endMeasurement,
                               mapMode,
                               onCancel,
                               onEndDrawPressed,
                               openMainMenuPanel,
                               openNotebookPanel,
                               selectingMode,
                               setDistance,
                               setMapModeToEdit,
                               toggleDialog,
                             }, mapComponentRef) => {
  console.log('Rendering HomeView...');

  return (
    <>
      <MapContainer
        mapMode={mapMode}
        onEndDrawPressed={onEndDrawPressed}
        ref={mapComponentRef}
        selectingMode={selectingMode}
        setDistance={setDistance}
        setMapModeToEdit={setMapModeToEdit}
      />

      <DeviceInfo/>
      <OfflineMapLabel/>
      <VersionCheckLabel/>

      <RightSideButtons
        animateRightSide={animateRightSide}
        clickHandler={clickHandler}
        closeNotebookPanel={closeNotebookPanel}
        distance={distance}
        endMeasurement={endMeasurement}
        mapMode={mapMode}
        onCancel={onCancel}
        onEndDrawPressed={onEndDrawPressed}
        openNotebookPanel={openNotebookPanel}
        selectingMode={selectingMode}
      />

      <LeftSideButtons
        animateLeftSide={animateLeftSide}
        clickHandler={clickHandler}
        closeMainMenuPanel={closeMainMenuPanel}
        dialogClickHandler={dialogClickHandler}
        dialogs={dialogs}
        openMainMenuPanel={openMainMenuPanel}
        toggleDialog={toggleDialog}
      />

      <Animated.View style={[notebookStyles.notebookDrawer, animateNotebookDrawer]}>
        <NotebookPanel
          closeNotebookPanel={closeNotebookPanel}
          createDefaultGeom={mapComponentRef?.current?.createDefaultGeom}
          openMainMenuPanel={openMainMenuPanel}
          zoomToSpots={mapComponentRef?.current?.zoomToSpots}
        />
      </Animated.View>
    </>
  );
});

export default HomeView;
