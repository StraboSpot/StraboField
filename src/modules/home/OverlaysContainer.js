import React, {forwardRef} from 'react';

import {useSelector} from 'react-redux';

import Dialog from './Dialog';
import LoadingSpinner from '../../shared/ui/Loading';
import {ErrorModal, StatusModal} from '../../shared/ui/modals';
import SaveMapsModal from '../maps/offline-maps/SaveMapsModal';
import InitialProjectLoadModal from '../project/load/InitialProjectLoadModal';

const OverlaysContainer = forwardRef(({
                                        closeMainMenuPanel,
                                        closeNotebookPanel,
                                        openMainMenuPanel,
                                        openNotebookPanel,
                                        openSpotInNotebook,
                                        zoomToCurrentLocation,
                                      }, mapComponentRef) => {
  const isHomeLoading = useSelector(state => state.home.loading.home);
  const isOfflineMapModalVisible = useSelector(state => state.home.isOfflineMapModalVisible);
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const modalVisible = useSelector(state => state.home.modalVisible);

  return (
    <>
      {isProjectLoadSelectionModalVisible && (
        <InitialProjectLoadModal
          closeMainMenuPanel={closeMainMenuPanel}
          closeNotebookPanel={closeNotebookPanel}
          openMainMenuPanel={openMainMenuPanel}
        />
      )}
      <ErrorModal/>
      <StatusModal/>
      {/*------------------------*/}
      <LoadingSpinner isLoading={isHomeLoading}/>
      {modalVisible && (
        <Dialog
          closeNotebookPanel={closeNotebookPanel}
          openNotebookPanel={openNotebookPanel}
          openSpotInNotebook={openSpotInNotebook}
          zoomToCurrentLocation={zoomToCurrentLocation}
        />
      )}
      {isOfflineMapModalVisible && (
        <SaveMapsModal
          getCurrentZoom={mapComponentRef?.current?.getCurrentZoom}
          getExtentString={mapComponentRef?.current?.getExtentString}
          getTileCount={mapComponentRef?.current?.getTileCount}
        />
      )}
    </>
  );
});

export default OverlaysContainer;
