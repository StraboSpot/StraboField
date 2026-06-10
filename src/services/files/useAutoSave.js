import {useEffect} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {clearLocalSaveNeeded, setAutoSaving} from '../../modules/connections/connections.slice';
import {isEmpty} from '../../shared/helpers';
import useDevice from '../device/useDevice';

const SAVE_INTERVAL_MS = 30 * 1000;
export const MAX_SAVES = 10;

const useAutoSave = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isSaveNeeded = useSelector(state => state.connections.isLocalSaveNeeded);
  const otherMapsDb = useSelector(state => state.map.customMaps);
  const projectDb = useSelector(state => state.project);
  const spotsDb = useSelector(state => state.spot.spots);

  const {pruneOldProjectSaves, saveProjectToDevice} = useDevice();

  /* Internal Functions */

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

  useEffect(() => {
    const timer = setInterval(runSave, SAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isSaveNeeded]);
};

export default useAutoSave;
