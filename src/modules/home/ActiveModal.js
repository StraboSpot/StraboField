import React, {useContext} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {setActiveModal} from './home.slice';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import {LeavePageContext} from '../notebook-panel/LeavePageContext';
import {MODALS} from '../page/page.constants';
import {MODAL_KEYS, PAGE_KEYS} from '../page/pageKeys.constants';
import {clearedSelectedSpots} from '../spots/spots.slice';

// Shows whichever modal home.activeModal names
const ActiveModal = ({
                       closeNotebookPanel,
                       openNotebookPanel,
                       openSpotInNotebook,
                       zoomToCurrentLocation,
                     }) => {
  console.log('Rendering ActiveModal...');

  const dispatch = useDispatch();
  const activeModal = useSelector(state => state.home.activeModal);
  const isNotebookPanelVisible = useSelector(state => state.notebook.isNotebookPanelVisible);
  const {confirmLeavePage, hasUnsavedPageChanges} = useContext(LeavePageContext);

  const modal = MODALS.find(m => m.key === activeModal);

  // Switching between a shortcut and its notebook page closes the notebook or changes its page
  const modalHandler = async (modalKey) => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
    if (isNotebookPanelVisible || SMALL_SCREEN) {
      if (isNotebookPanelVisible) closeNotebookPanel();
      if (Object.values(MODAL_KEYS.SHORTCUTS).includes(modalKey)) dispatch(clearedSelectedSpots());
      dispatch(setActiveModal({modal: modalKey}));
    }
    else {
      openNotebookPanel(modalKey);
      if (modalKey !== PAGE_KEYS.NOTES) dispatch(setActiveModal({modal: modalKey}));
      else if (activeModal !== MODAL_KEYS.OTHER.ADD_TAGS_TO_SPOTS) dispatch(setActiveModal({modal: null}));
    }
  };

  if (modal?.modal_component) {
    const ModalDisplayed = modal.modal_component();
    if (activeModal && !Object.keys(MODAL_KEYS.SHORTCUTS).find(s => s.key === activeModal)) {
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

export default ActiveModal;
