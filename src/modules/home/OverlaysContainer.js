import React, {forwardRef} from 'react';
import {Platform} from 'react-native';

import {useSelector} from 'react-redux';

import Dialog from './Dialog';
import {ErrorModal, InitialProjectLoadModal, StatusModal, WarningModal} from './modals';
import useDevice from '../../services/useDevice';
import LoadingSpinner from '../../shared/ui/Loading';
import SaveMapsModal from '../maps/offline-maps/SaveMapsModal';

const OverlaysContainer = forwardRef(({
                                        openSpotInNotebook,
                                        closeNotebookPanel,
                                        openMainMenuPanel,
                                        openNotebookPanel,
                                        zoomToCurrentLocation,
                                      }, mapComponentRef) => {

  const isHomeLoading = useSelector(state => state.home.loading.home);
  const isOfflineMapModalVisible = useSelector(state => state.home.isOfflineMapModalVisible);
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const modalVisible = useSelector(state => state.home.modalVisible);

  const {openURL} = useDevice();

  const openStraboSpotURL = () => openURL('https://www.strabospot.org/login');

  return (
    <>
      {isProjectLoadSelectionModalVisible && Platform.OS !== 'web' && (
        <InitialProjectLoadModal
          openMainMenuPanel={openMainMenuPanel}
          visible={isProjectLoadSelectionModalVisible}
        />
      )}
      <ErrorModal/>
      <StatusModal
        openMainMenuPanel={openMainMenuPanel}
        openUrl={openStraboSpotURL}
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
