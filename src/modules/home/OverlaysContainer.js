import React, {forwardRef, useEffect} from 'react';
import {Platform} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import Dialog from './Dialog';
import {applyPendingModal} from './home.slice';
import LoadingSpinner from '../../shared/ui/Loading';
import {MessageModal, StatusModal} from '../../shared/ui/modals';
import {MODAL_TRANSITION_DELAY} from '../../shared/ui/modals/modal.constants';
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
  const dispatch = useDispatch();
  const isHomeLoading = useSelector(state => state.home.loading.home);
  const isOfflineMapModalVisible = useSelector(state => state.home.isOfflineMapModalVisible);
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const pendingModal = useSelector(state => state.home.pendingModal);

  // Drive the second phase of an iOS modal switch: once a modal is queued (and the outgoing one is dismissing), wait
  // out the dismiss transition, then show it. Guaranteed to fire even for Dialog-driven modals, which unmount rather
  // than toggle `visible` and so never deliver an onDismiss to JS. Re-running on pendingModal cancels a stale timer.
  useEffect(() => {
    if (!pendingModal) return;
    const timer = setTimeout(() => dispatch(applyPendingModal()), MODAL_TRANSITION_DELAY);
    return () => clearTimeout(timer);
  }, [pendingModal]);

  return (
    <>
      {!isWeb && isProjectLoadSelectionModalVisible && (
        <InitialProjectLoadModal
          closeMainMenuPanel={closeMainMenuPanel}
          closeNotebookPanel={closeNotebookPanel}
          openMainMenuPanel={openMainMenuPanel}
        />
      )}
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
