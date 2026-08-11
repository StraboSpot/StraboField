import React, {forwardRef} from 'react';
import {Platform} from 'react-native';

import {useSelector} from 'react-redux';

import Dialog from './Dialog';
import LoadingSpinner from '../../shared/ui/Loading';
import {ErrorModal, MessageModal, StatusModal} from '../../shared/ui/modals';
import SaveMapsModal from '../maps/offline-maps/SaveMapsModal';
import InitialProjectLoadModal from '../project/load/InitialProjectLoadModal';
import ReauthModal from '../sign-in/ReauthModal';

// Web auto-logs in to a fixed project and cannot switch projects, so there is nothing to choose. The
// isProjectLoadSelectionModalVisible flag still runs on web — MapContainer uses it to arm the initial map zoom.
const isWeb = Platform.OS === 'web';

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
      {!isWeb && isProjectLoadSelectionModalVisible && (
        <InitialProjectLoadModal
          closeMainMenuPanel={closeMainMenuPanel}
          closeNotebookPanel={closeNotebookPanel}
          openMainMenuPanel={openMainMenuPanel}
        />
      )}
      <ErrorModal/>
      <MessageModal/>
      <StatusModal/>
      <ReauthModal/>
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
