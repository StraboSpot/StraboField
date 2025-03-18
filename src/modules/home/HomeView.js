import React, {forwardRef} from 'react';
import {Animated} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {LeftSideButtons, RightSideButtons} from './buttons';
import DeviceInfo from './DeviceInfo';
import uiStyles from '../../shared/ui/ui.styles';
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
    <SafeAreaView style={uiStyles.safeAreaView}>
      <MapContainer
        isSelectingForStereonet={isSelectingForStereonet}
        isSelectingForTagging={isSelectingForTagging}
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
        mapComponentRef={mapComponentRef}
        openMainMenuPanel={openMainMenuPanel}
        toggleDialog={toggleDialog}
      />

      <Animated.View style={[notebookStyles.notebookDrawer, animateNotebookDrawer]}>
        <NotebookPanel
          closeNotebookPanel={closeNotebookPanel}
          createDefaultGeom={mapComponentRef.current?.createDefaultGeom}
          openMainMenuPanel={openMainMenuPanel}
          zoomToSpots={mapComponentRef.current?.zoomToSpots}
        />
      </Animated.View>
    </SafeAreaView>
  );
});

export default HomeView;
