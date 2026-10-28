import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import {MAP_EDIT_CHOICES} from './editing/editing.constants';
import {MAP_MODES} from './maps.constants';
import mapReducer, {addedIntervalDragChangedSpotIds, startedIntervalDrag} from './maps.slice';
import useMapMode from './useMapMode';
import {UNSAVED_CHANGES_CHOICES} from '../../shared/ui/modals/unsavedChanges.constants';
import spotReducer, {editedOrCreatedSpots} from '../spots/spots.slice';

jest.mock('../../services/device/useDeviceOrientation', () => () => ({unlockOrientation: () => {}}));

// Whatever is waiting on confirmEndMapEditing goes ahead only when it resolves true. Getting that wrong either runs the
// action over a live edit, whose Save then overwrites what it changed, or never runs it at all.
describe('confirmEndMapEditing', () => {
  const renderHook = ({hasPendingEdits}) => {
    const map = {cancelEdits: jest.fn(), hasPendingEdits: () => hasPendingEdits, saveEdits: jest.fn()};
    const store = configureStore({reducer: {map: mapReducer, spot: spotReducer}});
    let hookApi;
    const Probe = () => {
      hookApi = useMapMode({mapComponentRef: {current: map}});
      return null;
    };
    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
    });
    return {getHook: () => hookApi, map, store};
  };

  const startEditing = getHook => ReactTestRenderer.act(() => getHook().setMapMode(MAP_MODES.EDIT));

  // Calls confirmEndMapEditing and, when a choice is given, answers its prompt the way UnsavedChangesModal does. Tests
  // run as iOS, where the answer goes out once the prompt has closed.
  const callConfirmEndMapEditing = async (getHook, choice) => {
    let hasEnded;
    await ReactTestRenderer.act(async () => {
      const ending = getHook().confirmEndMapEditing();
      if (choice) {
        getHook().endPromptProps.onChoose(choice);
        getHook().endPromptProps.onDismiss();
      }
      hasEnded = await ending;
    });
    return hasEnded;
  };

  it('goes ahead without asking when nothing is being edited', async () => {
    const {getHook, map} = renderHook({hasPendingEdits: true});
    expect(await callConfirmEndMapEditing(getHook)).toBe(true);
    expect(getHook().endPromptProps.isVisible).toBe(false);
    expect(map.cancelEdits).not.toHaveBeenCalled();
  });

  it('ends an edit with nothing changed without asking', async () => {
    const {getHook, map} = renderHook({hasPendingEdits: false});
    startEditing(getHook);
    expect(await callConfirmEndMapEditing(getHook)).toBe(true);
    expect(getHook().endPromptProps.isVisible).toBe(false);
    expect(map.cancelEdits).toHaveBeenCalled();
    expect(getHook().isMapEditing()).toBe(false);
  });

  it('asks before ending an edit with changes', async () => {
    const {getHook} = renderHook({hasPendingEdits: true});
    startEditing(getHook);
    ReactTestRenderer.act(() => {
      getHook().confirmEndMapEditing();
    });
    expect(getHook().endPromptProps.isVisible).toBe(true);
  });

  it('saves the edit and goes ahead on Save', async () => {
    const {getHook, map} = renderHook({hasPendingEdits: true});
    startEditing(getHook);
    expect(await callConfirmEndMapEditing(getHook, UNSAVED_CHANGES_CHOICES.SAVE)).toBe(true);
    expect(map.saveEdits).toHaveBeenCalled();
    expect(map.cancelEdits).not.toHaveBeenCalled();
    expect(getHook().isMapEditing()).toBe(false);
    expect(getHook().endPromptProps.isVisible).toBe(false);
  });

  it('cancels the edit and goes ahead on Discard', async () => {
    const {getHook, map} = renderHook({hasPendingEdits: true});
    startEditing(getHook);
    expect(await callConfirmEndMapEditing(getHook, UNSAVED_CHANGES_CHOICES.DISCARD)).toBe(true);
    expect(map.cancelEdits).toHaveBeenCalled();
    expect(map.saveEdits).not.toHaveBeenCalled();
    expect(getHook().isMapEditing()).toBe(false);
  });

  it('leaves the edit alone and holds back on Keep Editing', async () => {
    const {getHook, map} = renderHook({hasPendingEdits: true});
    startEditing(getHook);
    expect(await callConfirmEndMapEditing(getHook, UNSAVED_CHANGES_CHOICES.KEEP_EDITING)).toBe(false);
    expect(map.saveEdits).not.toHaveBeenCalled();
    expect(map.cancelEdits).not.toHaveBeenCalled();
    expect(getHook().isMapEditing()).toBe(true);
  });

  // A drag moves the intervals in the store as it goes, so canceling it has to put the snapshot back
  describe('during an interval drag', () => {
    const intervalBefore = {type: 'Feature', geometry: {type: 'Point', coordinates: [0, 0]}, properties: {id: 1}};
    const intervalAfter = {...intervalBefore, geometry: {type: 'Point', coordinates: [0, 10]}};

    const startDragging = ({hasMoved}) => {
      const hook = renderHook({hasPendingEdits: false});
      ReactTestRenderer.act(() => {
        hook.store.dispatch(editedOrCreatedSpots([intervalBefore]));
        hook.store.dispatch(startedIntervalDrag([intervalBefore]));
        if (hasMoved) {
          hook.store.dispatch(editedOrCreatedSpots([intervalAfter]));
          hook.store.dispatch(addedIntervalDragChangedSpotIds([1]));
        }
        hook.getHook().setMapMode(MAP_MODES.INTERVAL_DRAG);
      });
      return hook;
    };

    const getIntervalCoords = store => store.getState().spot.spots[1].geometry.coordinates;

    it('ends a drag that moved nothing without asking', async () => {
      const {getHook, store} = startDragging({hasMoved: false});
      expect(await callConfirmEndMapEditing(getHook)).toBe(true);
      expect(getHook().endPromptProps.isVisible).toBe(false);
      expect(store.getState().map.isDragIntervalMode).toBe(false);
      expect(getHook().isMapEditing()).toBe(false);
    });

    it('keeps the moved intervals on Save', async () => {
      const {getHook, store} = startDragging({hasMoved: true});
      expect(await callConfirmEndMapEditing(getHook, UNSAVED_CHANGES_CHOICES.SAVE)).toBe(true);
      expect(getIntervalCoords(store)).toEqual([0, 10]);
      expect(store.getState().map.isDragIntervalMode).toBe(false);
    });

    it('puts the intervals back on Discard', async () => {
      const {getHook, store} = startDragging({hasMoved: true});
      expect(await callConfirmEndMapEditing(getHook, UNSAVED_CHANGES_CHOICES.DISCARD)).toBe(true);
      expect(getIntervalCoords(store)).toEqual([0, 0]);
      expect(store.getState().map.isDragIntervalMode).toBe(false);
    });

    it('keeps dragging on Keep Editing', async () => {
      const {getHook, store} = startDragging({hasMoved: true});
      expect(await callConfirmEndMapEditing(getHook, UNSAVED_CHANGES_CHOICES.KEEP_EDITING)).toBe(false);
      expect(getIntervalCoords(store)).toEqual([0, 10]);
      expect(store.getState().map.isDragIntervalMode).toBe(true);
      expect(getHook().isMapEditing()).toBe(true);
    });

    it('puts the intervals back when the drag is canceled', async () => {
      const {getHook, store} = startDragging({hasMoved: true});
      await ReactTestRenderer.act(() => getHook().endMapEditing(MAP_EDIT_CHOICES.CANCEL));
      expect(getIntervalCoords(store)).toEqual([0, 0]);
      expect(store.getState().map.isDragIntervalMode).toBe(false);
    });
  });
});
