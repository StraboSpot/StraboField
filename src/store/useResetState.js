import {useDispatch, useSelector} from 'react-redux';

import {resetCompassState} from '../modules/compass/compass.slice';
import {resetSyncState} from '../modules/connections/connections.slice';
import {resetHomeState} from '../modules/home/home.slice';
import {resetMapState} from '../modules/maps/maps.slice';
import {resetOfflineMapsState} from '../modules/maps/offline-maps/offlineMaps.slice';
import {resetNotebookState} from '../modules/notebook-panel/notebook.slice';
import {resetProjectState, setTestingMode} from '../modules/project/projects.slice';
import {resetSpotState} from '../modules/spots/spots.slice';
import {resetUserState} from '../modules/user/userProfile.slice';
import useDevice from '../services/device/useDevice';

const useResetState = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isTestingMode = useSelector(state => state.project.isTestingMode);

  const {deleteProfileImageFile} = useDevice();

  /* Exported Functions */

  const clearProject = () => {
    dispatch(resetCompassState());
    dispatch(resetMapState());
    dispatch(resetNotebookState());
    dispatch(resetProjectState());
    dispatch(resetSpotState());
    dispatch(resetSyncState());
    dispatch(setTestingMode(isTestingMode));  // Don't modify isTestingMode state
  };

  const clearUser = () => {
    clearProject();
    dispatch(setTestingMode(false));
    dispatch(resetHomeState());
    dispatch(resetOfflineMapsState());
    dispatch(resetUserState());

    deleteProfileImageFile();
  };

  return {
    clearProject,
    clearUser,
  };
};

export default useResetState;
