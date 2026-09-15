import React from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {setModalVisible} from './home.slice';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import {MODALS} from '../page/page.constants';
import {MODAL_KEYS, PAGE_KEYS} from '../page/pageKeys.constants';
import {clearedSelectedSpots} from '../spots/spots.slice';

const Dialog = ({
                  closeNotebookPanel,
                  openNotebookPanel,
                  openSpotInNotebook,
                  zoomToCurrentLocation,
                }) => {
  console.log('Rendering Dialog...');

  const dispatch = useDispatch();
  const isNotebookPanelVisible = useSelector(state => state.notebook.isNotebookPanelVisible);
  const modalVisible = useSelector(state => state.home.modalVisible);

  const modal = MODALS.find(m => m.key === modalVisible);

  const modalHandler = (modalKey) => {
    if (isNotebookPanelVisible || SMALL_SCREEN) {
      if (isNotebookPanelVisible) {
        closeNotebookPanel();
        if (modalVisible && !Object.keys(MODAL_KEYS.SHORTCUTS).find(s => s.key === modalVisible)) {
          dispatch(setModalVisible({modal: null}));
        }
      }
      if (Object.values(MODAL_KEYS.SHORTCUTS).includes(modalKey)) dispatch(clearedSelectedSpots());
      dispatch(setModalVisible({modal: modalKey}));
    }
    else {
      if (modalVisible !== MODAL_KEYS.OTHER.ADD_TAGS_TO_SPOTS) dispatch(setModalVisible({modal: null}));
      openNotebookPanel(modalKey);
      if (modalKey !== PAGE_KEYS.NOTES) dispatch(setModalVisible({modal: modalKey}));
    }
  };

  if (modal?.modal_component) {
    const ModalDisplayed = modal.modal_component;
    if (modalVisible && !Object.keys(MODAL_KEYS.SHORTCUTS).find(s => s.key === modalVisible)) {
      return (
        <ModalDisplayed
          modalKey={modal.key}
          onPress={modalHandler}
          openSpotInNotebook={openSpotInNotebook}
          zoomToCurrentLocation={zoomToCurrentLocation}
        />
      );
    }
    else return <ModalDisplayed modalKey={modal.key} onPress={modalHandler}/>;
  }
};

export default Dialog;
