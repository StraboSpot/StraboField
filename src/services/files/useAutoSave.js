import {useEffect, useRef} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {clearLocalSaveNeeded, setAutoSaving, setNextAutoSaveTime} from '../../modules/connections/connections.slice';
import {isEmpty} from '../../shared/helpers';
import useDevice from '../device/useDevice';

export const MAX_SAVES = 10;

const useAutoSave = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isSaveNeeded = useSelector(state => state.connections.isLocalSaveNeeded);
  const nextAutoSaveTime = useSelector(state => state.connections.nextAutoSaveTime);
  const otherMapsDb = useSelector(state => state.map.customMaps);
  const projectDb = useSelector(state => state.project);
  const saveFrequency = useSelector(state => state.connections.backupFrequency?.save);
  const spotsDb = useSelector(state => state.spot.spots);

  const {pruneOldProjectSaves, saveProjectToDevice} = useDevice();

  /* Internal Functions */

  const SAVE_INTERVAL_MS = saveFrequency * 60 * 1000;

  const runSave = async () => {
    if (!isSaveNeeded || isEmpty(projectDb.project)) return;
    try {
      dispatch(setAutoSaving(true));
      const snapshot = {
        mapNamesDb: {},
        mapTilesDb: {},
        otherMapsDb: otherMapsDb,
        projectDb: projectDb,
        spotsDb: spotsDb,
      };
      await saveProjectToDevice(snapshot);
      await pruneOldProjectSaves(MAX_SAVES);
      dispatch(clearLocalSaveNeeded());
      console.log('Auto save complete.', snapshot);
    }
    catch (err) {
      console.error('Auto save failed:', err);
    }
    finally {
      dispatch(setAutoSaving(false));
    }
  };

  /* Side Effects */

  const runSaveRef = useRef(runSave);
  runSaveRef.current = runSave;

  useEffect(() => {
    console.log('UE Auto Save', SAVE_INTERVAL_MS);
    dispatch(setNextAutoSaveTime(SAVE_INTERVAL_MS ? Date.now() + SAVE_INTERVAL_MS : null));
  }, [saveFrequency]);

  useEffect(() => {
    if (!nextAutoSaveTime) return;
    const delay = Math.max(0, nextAutoSaveTime - Date.now());
    const timer = setTimeout(async () => {
      await runSaveRef.current();
      dispatch(setNextAutoSaveTime(SAVE_INTERVAL_MS ? Date.now() + SAVE_INTERVAL_MS : null));
    }, delay);
    return () => clearTimeout(timer);
  }, [nextAutoSaveTime]);
};

export default useAutoSave;
