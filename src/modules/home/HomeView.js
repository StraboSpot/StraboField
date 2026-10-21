import React, {forwardRef} from 'react';
import {Animated} from 'react-native';

import LeftSideButtons from './buttons/LeftSideButtons';
import RightSideButtons from './buttons/RightSideButtons';
import DeviceInfo from './DeviceInfo';
import MapContainer from '../maps/MapContainer';
import OfflineMapPreviewBanner from '../maps/offline-maps/OfflineMapPreviewBanner';
import notebookStyles from '../notebook-panel/notebook.styles';
import NotebookPanel from '../notebook-panel/NotebookPanel';
import VersionCheckLabel from '../version-check/VersionCheckLabel';

const HomeView = forwardRef(({
                               animateLeftSide,
                               animateNotebookDrawer,
                               animateRightSide,
                               closeMainMenuPanel,
                               closeNotebookPanel,
                               confirmEndMapEditing,
                               dialogs,
                               distance,
                               endMeasurement,
                               handleHomeAction,
                               handleHomeActionFromMenu,
                               hasDrawTools,
                               isCreateToolsDisabled,
                               isMapEditing,
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
      <OfflineMapPreviewBanner/>
      <VersionCheckLabel/>

      <RightSideButtons
        animateRightSide={animateRightSide}
        closeNotebookPanel={closeNotebookPanel}
        confirmEndMapEditing={confirmEndMapEditing}
        distance={distance}
        endMeasurement={endMeasurement}
        handleHomeAction={handleHomeAction}
        hasDrawTools={hasDrawTools}
        isCreateToolsDisabled={isCreateToolsDisabled}
        isMapEditing={isMapEditing}
        mapMode={mapMode}
        onCancel={onCancel}
        onEndDrawPressed={onEndDrawPressed}
        openMainMenuPanel={openMainMenuPanel}
        openNotebookPanel={openNotebookPanel}
        selectingMode={selectingMode}
      />

      <LeftSideButtons
        animateLeftSide={animateLeftSide}
        closeMainMenuPanel={closeMainMenuPanel}
        dialogs={dialogs}
        handleHomeAction={handleHomeAction}
        handleHomeActionFromMenu={handleHomeActionFromMenu}
        openMainMenuPanel={openMainMenuPanel}
        toggleDialog={toggleDialog}
        zoomToCustomMap={bbox => mapComponentRef?.current?.zoomToCustomMap(bbox)}
      />

      <Animated.View style={[notebookStyles.notebookDrawer, animateNotebookDrawer]}>
        <NotebookPanel
          closeNotebookPanel={closeNotebookPanel}
          createDefaultGeom={() => mapComponentRef.current?.createDefaultGeom()}
          openMainMenuPanel={openMainMenuPanel}
          zoomToSpots={spots => mapComponentRef.current?.zoomToSpots(spots)}
        />
      </Animated.View>
    </>
  );
});

export default HomeView;
