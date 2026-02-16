import {useDispatch} from 'react-redux';

import useDevice from './useDevice';
import {resetCompassState} from '../modules/compass/compass.slice';
import {resetHomeState} from '../modules/home/home.slice';
import {resetMapState} from '../modules/maps/maps.slice';
import {resetOfflineMapsState} from '../modules/maps/offline-maps/offlineMaps.slice';
import {resetNotebookState} from '../modules/notebook-panel/notebook.slice';
import {resetProjectState} from '../modules/project/projects.slice';
import {resetSpotState} from '../modules/spots/spots.slice';
import {resetUserState} from '../modules/user/userProfile.slice';

const useResetState = () => {
  /* Data Hooks / State */

  const dispatch = useDispatch();

  const {deleteProfileImageFile} = useDevice();

  /* Exported Functions */

  const clearProject = () => {
    dispatch(resetCompassState());
    dispatch(resetMapState());
    dispatch(resetNotebookState());
    dispatch(resetProjectState());
    dispatch(resetSpotState());
  };

  const clearUser = () => {
    clearProject();
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
