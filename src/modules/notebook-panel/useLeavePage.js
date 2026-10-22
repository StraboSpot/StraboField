import {useRef, useState} from 'react';

import {useDispatch, useStore} from 'react-redux';

import {setNotebookPageVisible} from './notebook.slice';
import {UNSAVED_CHANGES_CHOICES} from '../../shared/ui/modals/unsavedChanges.constants';
import useUnsavedChangesPrompt from '../../shared/ui/modals/useUnsavedChangesPrompt';
import useSpots from '../spots/useSpots';

// Asks about a notebook page's unsaved changes before anything leaves it. The page is still open while it asks, so
// Save is the page's own Save. HomeContainer calls this once and provides it through LeavePageContext, since a page
// is left from the map, the main menu and the shortcuts as well as from inside the notebook.
const useLeavePage = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const store = useStore();

  const {isSpotReadOnly} = useSpots();
  const {askAboutUnsavedChanges, promptProps} = useUnsavedChangesPrompt();

  /* Local State */

  // The page on screen, as useUnsavedFormChanges registered it
  const openPageRef = useRef(null);
  // The page whose form has changes, as state for what has to know as it renders
  const [changedPageOwner, setChangedPageOwner] = useState(null);
  const [isPromptSaveHeld, setIsPromptSaveHeld] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');

  /* Exported Functions */

  // Resolves false for Keep Editing, or for a Save that did not go through, meaning the caller must stop. Save is
  // held while the page's own Save is, so the way out can't save what the page wouldn't, and the prompt lists why.
  const confirmLeavePage = async () => {
    if (!hasUnsavedPageChanges()) return true;
    const openPage = openPageRef.current;
    const saveHeldReasons = openPage.getSaveHeldReasons();
    const isSaveHeld = saveHeldReasons.length > 0;
    setIsPromptSaveHeld(isSaveHeld);
    setPromptMessage(openPage.getMessage() + (isSaveHeld ? '\n\nTo save, first fix:\n' + saveHeldReasons.join('\n') : ''));
    const choice = await askAboutUnsavedChanges();
    if (choice === UNSAVED_CHANGES_CHOICES.KEEP_EDITING) return false;
    if (choice === UNSAVED_CHANGES_CHOICES.DISCARD) {
      openPage.discard();
      return true;
    }
    return openPage.save();
  };

  const goToNotebookPage = async (key) => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return false;
    dispatch(setNotebookPageVisible(key));
    return true;
  };

  // Checked before awaiting confirmLeavePage, so callers stay synchronous when there is nothing to ask about. A
  // Read Only Spot has nothing to save, including one whose dataset was locked after the changes were made.
  const hasUnsavedPageChanges = () => !!openPageRef.current?.getHasUnsavedChanges()
    && !isSpotReadOnly(store.getState().spot.selectedSpot);

  // Called as the page renders, so it only touches the ref. Changes are reported separately, from an effect.
  const registerOpenPage = (owner, openPage) => {
    openPageRef.current = {...openPage, owner: owner};
  };

  const reportOpenPageChanged = (owner, isChanged) => {
    setChangedPageOwner(prevOwner => (isChanged ? owner : prevOwner === owner ? null : prevOwner));
  };

  const unregisterOpenPage = (owner) => {
    if (openPageRef.current?.owner === owner) openPageRef.current = null;
  };

  return {
    confirmLeavePage,
    goToNotebookPage,
    hasUnsavedPageChanges,
    // As of this render, for what is drawn by it. Before leaving, ask hasUnsavedPageChanges.
    isPageChanged: changedPageOwner !== null,
    leavePromptProps: {...promptProps, isSaveDisabled: isPromptSaveHeld, message: promptMessage},
    registerOpenPage,
    reportOpenPageChanged,
    unregisterOpenPage,
  };
};

export default useLeavePage;
