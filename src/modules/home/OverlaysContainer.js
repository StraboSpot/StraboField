import React, {forwardRef} from 'react';
import {Platform} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import Dialog from './Dialog';
import {setIsProjectLoadSelectionModalVisible} from './home.slice';
import LoadingSpinner from '../../shared/ui/Loading';
import {ErrorModal, StatusModal, WarningModal} from '../../shared/ui/modals';
import SaveMapsModal from '../maps/offline-maps/SaveMapsModal';
import InitialProjectLoadModal from '../project/load/InitialProjectLoadModal';
import LoadProjectModal from '../project/load/LoadProjectModal';

const OverlaysContainer = forwardRef(({
                                        closeMainMenuPanel,
                                        closeNotebookPanel,
                                        openMainMenuPanel,
                                        openNotebookPanel,
                                        openSpotInNotebook,
                                        zoomToCurrentLocation,
                                      }, mapComponentRef) => {
  const dispatch = useDispatch();
  const isHomeLoading = useSelector(state => state.home.loading.home);
  const isOfflineMapModalVisible = useSelector(state => state.home.isOfflineMapModalVisible);
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const modalVisible = useSelector(state => state.home.modalVisible);

  const closeProjectLoadModal = () => {
    if (closeMainMenuPanel) closeMainMenuPanel();
    if (isProjectLoadSelectionModalVisible) dispatch(setIsProjectLoadSelectionModalVisible(false));
  };

  return (
    <>
      {isProjectLoadSelectionModalVisible && Platform.OS !== 'web' && (
        <InitialProjectLoadModal closeMainMenuPanel={closeMainMenuPanel} openMainMenuPanel={openMainMenuPanel}/>
      )}
      {isProjectLoadSelectionModalVisible && Platform.OS === 'web' && (
        <LoadProjectModal closeModal={closeProjectLoadModal}/>
      )}
      <ErrorModal/>
      <StatusModal openMainMenuPanel={openMainMenuPanel}/>
      <WarningModal/>
      {/*------------------------*/}
      <LoadingSpinner isLoading={isHomeLoading}/>
      {modalVisible && (
        <Dialog
          closeNotebookPanel={closeNotebookPanel}
          openNotebookPanel={openNotebookPanel}
          openSpotInNotebook={openSpotInNotebook}
          updateSpotsInMapExtent={mapComponentRef.current?.updateSpotsInMapExtent}
          zoomToCurrentLocation={zoomToCurrentLocation}
        />
      )}
      {isOfflineMapModalVisible && (
        <SaveMapsModal
          getCurrentZoom={mapComponentRef.current.getCurrentZoom}
          getExtentString={mapComponentRef.current.getExtentString}
          getTileCount={mapComponentRef.current.getTileCount}
        />
      )}
    </>
  );
});

export default OverlaysContainer;
