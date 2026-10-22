import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import notebookReducer from './notebook.slice';
import useLeavePage from './useLeavePage';
import {UNSAVED_CHANGES_CHOICES} from '../../shared/ui/modals/unsavedChanges.constants';
import spotReducer from '../spots/spots.slice';

let mockIsReadOnly = false;
jest.mock('../spots/useSpots', () => () => ({isSpotReadOnly: () => mockIsReadOnly}));

// A page goes only when goToNotebookPage resolves true. Getting that wrong either leaves over unsaved changes, which
// are then lost, or keeps the user on a page they chose to leave.
describe('goToNotebookPage', () => {
  const renderHook = () => {
    const store = configureStore({reducer: {notebook: notebookReducer, spot: spotReducer}});
    let hookApi;
    const Probe = () => {
      hookApi = useLeavePage();
      return null;
    };
    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
    });
    return {getHook: () => hookApi, store};
  };

  const openPage = ({getHook, hasUnsavedChanges, isSaved = true, saveHeldReasons = []}) => {
    const page = {
      discard: jest.fn(),
      getHasUnsavedChanges: () => hasUnsavedChanges,
      getMessage: () => 'Your changes to this Fabric haven\'t been saved.',
      getSaveHeldReasons: () => saveHeldReasons,
      save: jest.fn(async () => isSaved),
    };
    getHook().registerOpenPage({}, page);
    return page;
  };

  // Goes to the Notes page and, when a choice is given, answers the prompt the way UnsavedChangesModal does. Tests
  // run as iOS, where the answer goes out once the prompt has closed.
  const callGoToNotebookPage = async (getHook, choice) => {
    let hasGone;
    await ReactTestRenderer.act(async () => {
      const going = getHook().goToNotebookPage('notes');
      if (choice) {
        getHook().leavePromptProps.onChoose(choice);
        getHook().leavePromptProps.onDismiss();
      }
      hasGone = await going;
    });
    return hasGone;
  };

  const getPageVisible = store => store.getState().notebook.visibleNotebookPagesStack.slice(-1)[0];

  beforeEach(() => {
    mockIsReadOnly = false;
  });

  it('goes without asking when no page has registered', async () => {
    const {getHook, store} = renderHook();
    expect(await callGoToNotebookPage(getHook)).toBe(true);
    expect(getHook().leavePromptProps.isVisible).toBe(false);
    expect(getPageVisible(store)).toBe('notes');
  });

  it('goes without asking from a page with nothing changed', async () => {
    const {getHook, store} = renderHook();
    openPage({getHook, hasUnsavedChanges: false});
    expect(await callGoToNotebookPage(getHook)).toBe(true);
    expect(getHook().leavePromptProps.isVisible).toBe(false);
    expect(getPageVisible(store)).toBe('notes');
  });

  it('goes without asking from a Read Only Spot', async () => {
    mockIsReadOnly = true;
    const {getHook, store} = renderHook();
    const page = openPage({getHook, hasUnsavedChanges: true});
    expect(await callGoToNotebookPage(getHook)).toBe(true);
    expect(page.save).not.toHaveBeenCalled();
    expect(getPageVisible(store)).toBe('notes');
  });

  it('asks with the page\'s own message before leaving its changes', () => {
    const {getHook} = renderHook();
    openPage({getHook, hasUnsavedChanges: true});
    ReactTestRenderer.act(() => {
      getHook().goToNotebookPage('notes');
    });
    expect(getHook().leavePromptProps.isVisible).toBe(true);
    expect(getHook().leavePromptProps.message).toBe('Your changes to this Fabric haven\'t been saved.');
    expect(getHook().leavePromptProps.isSaveDisabled).toBe(false);
  });

  // The page's own Save would refuse, so the way out must not save what the page wouldn't
  it('holds Save, and lists why, while the page\'s own Save is held', () => {
    const {getHook} = renderHook();
    openPage({getHook, hasUnsavedChanges: true, saveHeldReasons: ['Strike: Required', 'Dip: Required']});
    ReactTestRenderer.act(() => {
      getHook().goToNotebookPage('notes');
    });
    expect(getHook().leavePromptProps.isSaveDisabled).toBe(true);
    expect(getHook().leavePromptProps.message).toBe('Your changes to this Fabric haven\'t been saved.'
      + '\n\nTo save, first fix:\nStrike: Required\nDip: Required');
  });

  it('stays on Keep Editing', async () => {
    const {getHook, store} = renderHook();
    const page = openPage({getHook, hasUnsavedChanges: true});
    expect(await callGoToNotebookPage(getHook, UNSAVED_CHANGES_CHOICES.KEEP_EDITING)).toBe(false);
    expect(page.save).not.toHaveBeenCalled();
    expect(page.discard).not.toHaveBeenCalled();
    expect(getPageVisible(store)).toBeUndefined();
  });

  it('discards the changes and goes on Discard', async () => {
    const {getHook, store} = renderHook();
    const page = openPage({getHook, hasUnsavedChanges: true});
    expect(await callGoToNotebookPage(getHook, UNSAVED_CHANGES_CHOICES.DISCARD)).toBe(true);
    expect(page.discard).toHaveBeenCalled();
    expect(page.save).not.toHaveBeenCalled();
    expect(getPageVisible(store)).toBe('notes');
  });

  it('saves the changes and goes on Save', async () => {
    const {getHook, store} = renderHook();
    const page = openPage({getHook, hasUnsavedChanges: true});
    expect(await callGoToNotebookPage(getHook, UNSAVED_CHANGES_CHOICES.SAVE)).toBe(true);
    expect(page.save).toHaveBeenCalled();
    expect(getPageVisible(store)).toBe('notes');
  });

  it('stays when Save does not go through', async () => {
    const {getHook, store} = renderHook();
    const page = openPage({getHook, hasUnsavedChanges: true, isSaved: false});
    expect(await callGoToNotebookPage(getHook, UNSAVED_CHANGES_CHOICES.SAVE)).toBe(false);
    expect(page.save).toHaveBeenCalled();
    expect(getPageVisible(store)).toBeUndefined();
  });

  // Read as the phone layout renders, to keep a swipe from leaving a page with changes
  it('reports the page on screen as changed until it says otherwise', () => {
    const {getHook} = renderHook();
    const oldOwner = {};
    const newOwner = {};
    ReactTestRenderer.act(() => getHook().reportOpenPageChanged(oldOwner, true));
    expect(getHook().isPageChanged).toBe(true);
    ReactTestRenderer.act(() => getHook().reportOpenPageChanged(newOwner, true));
    ReactTestRenderer.act(() => getHook().reportOpenPageChanged(oldOwner, false));
    expect(getHook().isPageChanged).toBe(true);
    ReactTestRenderer.act(() => getHook().reportOpenPageChanged(newOwner, false));
    expect(getHook().isPageChanged).toBe(false);
  });

  // The page replacing another renders before the old one unmounts, so the old one must not clear the new one
  it('keeps the newer page when the one it replaced unregisters', async () => {
    const {getHook} = renderHook();
    const oldOwner = {};
    getHook().registerOpenPage(oldOwner, {getHasUnsavedChanges: () => false});
    getHook().registerOpenPage({}, {getHasUnsavedChanges: () => true});
    getHook().unregisterOpenPage(oldOwner);
    expect(getHook().hasUnsavedPageChanges()).toBe(true);
  });
});
