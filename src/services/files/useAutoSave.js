import {useEffect} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {clearLocalSaveNeeded, setAutoSaving, setNextAutoSaveTime} from '../../modules/connections/connections.slice';
import {
  stripMapboxTokenFromCustomMaps,
  stripMapboxTokenFromProject,
} from '../../modules/maps/custom-maps/customMaps.helpers';
import {isEmpty} from '../../shared/helpers';
import {store} from '../../store/ConfigureStore';
import useDevice from '../device/useDevice';

export const MAX_SAVES = 10;

// Saves the open project to the device if it has changed since the last save. Upload and download run it first,
// whatever the auto-save frequency, so a download never replaces changes that exist nowhere else.
export const useAutoSaveNow = () => {
  const dispatch = useDispatch();
  const {pruneOldProjectSaves, saveProjectToDevice} = useDevice();

  const autoSaveNow = async () => {
    const {connections, map, project: projectDb, spot} = store.getState();
    if (!connections.isLocalSaveNeeded || isEmpty(projectDb.project)) return {hasFailed: false, hasSaved: false};
    try {
      dispatch(setAutoSaving(true));
      const snapshot = {
        mapNamesDb: {},
        mapTilesDb: {},
        otherMapsDb: stripMapboxTokenFromCustomMaps(map.customMaps),
        projectDb: {...projectDb, project: stripMapboxTokenFromProject(projectDb.project)},
        spotsDb: spot.spots,
      };
      await saveProjectToDevice(snapshot);
      await pruneOldProjectSaves(MAX_SAVES);
      dispatch(clearLocalSaveNeeded());
      console.log('Auto save complete. Spots:', Object.keys(spot.spots).length,
        'Custom maps:', Object.keys(map.customMaps).length);
      return {hasFailed: false, hasSaved: true};
    }
    catch (err) {
      console.error('Auto save failed:', err);
      return {hasFailed: true, hasSaved: false};
    }
    finally {
      dispatch(setAutoSaving(false));
    }
  };

  return {autoSaveNow};
};

const useAutoSave = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const nextAutoSaveTime = useSelector(state => state.connections.nextAutoSaveTime);
  const saveFrequency = useSelector(state => state.connections.backupFrequency?.save);

  const {autoSaveNow} = useAutoSaveNow();

  /* Internal Functions */

  const SAVE_INTERVAL_MS = saveFrequency * 60 * 1000;

  /* Side Effects */

  useEffect(() => {
    console.log('Auto Save interval set (ms):', SAVE_INTERVAL_MS);
    dispatch(setNextAutoSaveTime(SAVE_INTERVAL_MS ? Date.now() + SAVE_INTERVAL_MS : null));
  }, [saveFrequency]);

  useEffect(() => {
    if (!nextAutoSaveTime) return;
    const delay = Math.max(0, nextAutoSaveTime - Date.now());
    const timer = setTimeout(async () => {
      await autoSaveNow();
      dispatch(setNextAutoSaveTime(SAVE_INTERVAL_MS ? Date.now() + SAVE_INTERVAL_MS : null));
    }, delay);
    return () => clearTimeout(timer);
  }, [nextAutoSaveTime]);
};

export default useAutoSave;
