import {useRef, useState} from 'react';
import {Platform} from 'react-native';

import {useDispatch, useStore} from 'react-redux';

import {MAP_EDIT_CHOICES} from './editing/editing.constants';
import {MAP_MODES} from './maps.constants';
import {canceledIntervalDrag, savedIntervalDragReordering} from './maps.slice';
import {isEmpty} from '../../shared/helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import useDeviceOrientation from '../home/useDeviceOrientation';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedOrCreatedSpots, restoredIntervalDragSnapshot} from '../spots/spots.slice';

// The map mode, and ending a map edit or interval drag before anything else changes a Spot. HomeContainer calls this
// once and passes it down, so the notebook and main menu openers can end them themselves.
const useMapMode = ({mapComponentRef}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const store = useStore();

  const {unlockOrientation} = useDeviceOrientation();

  /* Local State */

  const [isEndPromptVisible, setIsEndPromptVisible] = useState(false);
  const [mapMode, setMapModeState] = useState(MAP_MODES.VIEW);
  // The prompt's answer, and the confirmEndMapEditing waiting for it
  const endPromptRef = useRef({choice: null, resolve: null});
  // Lets a check made right after the mode changes see the change without waiting for a render
  const mapModeRef = useRef(mapMode);

  /* Internal Functions */

  const answerEndPrompt = () => {
    const {choice, resolve} = endPromptRef.current;
    endPromptRef.current = {choice: null, resolve: null};
    resolve?.(choice);
  };

  // A drag moves the intervals as it goes, recording each one it moves. Saving marks those changed for upload;
  // canceling puts back the snapshot taken when the drag started.
  const endIntervalDrag = (choice) => {
    const {intervalDragChangedSpotIds: movedSpotIds, intervalDragSnapshot} = store.getState().map;
    if (choice === MAP_EDIT_CHOICES.SAVE) {
      if (!isEmpty(movedSpotIds)) dispatch(updatedModifiedTimestampsBySpotsIds(movedSpotIds));
      dispatch(savedIntervalDragReordering());
    }
    else {
      if (!isEmpty(movedSpotIds)) {
        dispatch(restoredIntervalDragSnapshot(intervalDragSnapshot));
        if (Platform.OS !== 'web') dispatch(editedOrCreatedSpots(intervalDragSnapshot));
      }
      dispatch(canceledIntervalDrag());
    }
  };

  const hasPendingChanges = () => (mapModeRef.current === MAP_MODES.INTERVAL_DRAG
    ? !isEmpty(store.getState().map.intervalDragChangedSpotIds)
    : mapComponentRef.current?.hasPendingEdits());

  /* Exported Functions */

  // A map edit writes whole copies of the Spots on Save, and an interval drag's changes aren't kept until Save, so
  // either has to end before anything else changes or creates a Spot. With no changes it just ends; otherwise the
  // user picks Save Edits or Keep Editing. Resolves false only for Keep Editing, meaning the caller must stop.
  const confirmEndMapEditing = async () => {
    if (!isMapEditing()) return true;
    if (!hasPendingChanges()) {
      await endMapEditing(MAP_EDIT_CHOICES.CANCEL);
      return true;
    }
    const choice = await new Promise((resolve) => {
      endPromptRef.current = {choice: MAP_EDIT_CHOICES.CONTINUE_EDITING, resolve};
      setIsEndPromptVisible(true);
    });
    if (choice === MAP_EDIT_CHOICES.CONTINUE_EDITING) return false;
    await endMapEditing(choice);
    return true;
  };

  // Ends a map edit or interval drag, saving or canceling its changes as chosen
  const endMapEditing = async (choice) => {
    if (mapModeRef.current === MAP_MODES.INTERVAL_DRAG) endIntervalDrag(choice);
    else if (choice === MAP_EDIT_CHOICES.SAVE) mapComponentRef.current?.saveEdits();
    else await mapComponentRef.current?.cancelEdits();
    setMapMode(MAP_MODES.VIEW);
    if (!SMALL_SCREEN) unlockOrientation();
  };

  // iOS drops a modal opened while another is still closing, and the action waiting on the prompt may open one, so
  // on iOS the answer goes out once the prompt has closed (handleEndPromptDismissed)
  const handleEndPromptChoice = (choice) => {
    endPromptRef.current.choice = choice;
    setIsEndPromptVisible(false);
    if (Platform.OS !== 'ios') answerEndPrompt();
  };

  const handleEndPromptDismissed = () => {
    if (Platform.OS === 'ios') answerEndPrompt();
  };

  // Map editing here covers an interval drag too. Checked before awaiting confirmEndMapEditing, so callers stay
  // synchronous when nothing is being edited.
  const isMapEditing = () => [MAP_MODES.EDIT, MAP_MODES.INTERVAL_DRAG].includes(mapModeRef.current);

  const setMapMode = (mode) => {
    mapModeRef.current = mode;
    setMapModeState(mode);
  };

  return {
    confirmEndMapEditing,
    endMapEditing,
    handleEndPromptChoice,
    handleEndPromptDismissed,
    isEndPromptVisible,
    isMapEditing,
    mapMode,
    setMapMode,
  };
};

export default useMapMode;
