import React, {forwardRef} from 'react';
import {Platform} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import Dialog from './Dialog';
import {
  addedStatusMessage,
  clearedStatusMessages,
  setIsProjectLoadSelectionModalVisible,
  setLoadingStatus,
} from './home.slice';
import {ErrorModal, InitialProjectLoadModal, StatusModal, WarningModal} from './modals';
import useDevice from '../../services/useDevice.web';
import useExport from '../../services/useExport.web';
import LoadingSpinner from '../../shared/ui/Loading';
import SaveMapsModal from '../maps/offline-maps/SaveMapsModal';

const OverlaysContainer = forwardRef(({
                                        openSpotInNotebook,
                                        closeNotebookPanel,
                                        openMainMenuPanel,
                                        openNotebookPanel,
                                        zoomToCurrentLocation,
                                      }, mapComponentRef) => {

  const dispatch = useDispatch();
  const backupFileName = useSelector(state => state.project.backupFileName);
  const isHomeLoading = useSelector(state => state.home.loading.home);
  const isOfflineMapModalVisible = useSelector(state => state.home.isOfflineMapModalVisible);
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const modalVisible = useSelector(state => state.home.modalVisible);

  const {openURL} = useDevice();
  const {zipAndExportProjectFolder} = useExport();

  const closeInitialProjectLoadModal = () => {
    // console.log('Starting Project...');
    dispatch(setIsProjectLoadSelectionModalVisible(false));
  };

  // const exportProject = async () => {
  //   dispatch(clearedStatusMessages());
  //   // console.log('Exporting Project');
  //   dispatch(addedStatusMessage(`Exporting ${backupFileName}!`));
  //   await zipAndExportProjectFolder(null, null, true);
  //   const exportCompleteMessage = Platform.OS === 'ios' ? `\n\nProject (${backupFileName}) has been exported!`
  //     : `\n\nProject (${backupFileName}) has been exported to the Downloads folder!`;
  //   dispatch(addedStatusMessage(exportCompleteMessage));
  //   dispatch(setLoadingStatus({view: 'modal', bool: false}));
  //   // console.log(`Project ${backupFileName} has been exported!`);
  // };

  // const openStraboSpotURL = () => openURL('https://www.strabospot.org/login');

  return (
    <>
      {isProjectLoadSelectionModalVisible && Platform.OS !== 'web' && (
        <InitialProjectLoadModal
          closeModal={closeInitialProjectLoadModal}
          openMainMenuPanel={openMainMenuPanel}
          visible={isProjectLoadSelectionModalVisible}
        />
      )}
      <ErrorModal/>
      {/*TODO: Fix this so user can export from Status Modal after backup*/}
      <StatusModal
        // exportProject={exportProject}
        openMainMenuPanel={openMainMenuPanel}
        // openUrl={openStraboSpotURL}
      />
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
