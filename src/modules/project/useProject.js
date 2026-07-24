import {Platform} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {DEFAULT_GEOLOGIC_TYPES, DEFAULT_RELATIONSHIP_TYPES} from './project.constants';
import {
  addedDataset,
  addedProjectDescription,
  deletedDataset,
  setActiveDatasets,
  setTargetDataset,
} from './projects.slice';
import useDevice from '../../services/device/useDevice';
import useServerRequests from '../../services/network/useServerRequests';
import {getNewId, isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import useResetState from '../../store/useResetState';
import {
  addedStatusMessage,
  clearedStatusMessages,
  removedLastStatusMessage,
  setIsStatusMessagesModalVisible,
  setLoadingStatus,
} from '../home/home.slice';
import {clearedSpotsInMapExtentIds, clearedStratSection, setCurrentImageBasemap} from '../maps/maps.slice';
import {clearedSelectedSpots, deletedSpots} from '../spots/spots.slice';

const useProject = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const datasets = useSelector(state => state.project.datasets) || {};
  const readOnlyDatasetsIds = useSelector(state => state.project.readOnlyDatasetsIds) || [];
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const stratSection = useSelector(state => state.map.stratSection);
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);
  const user = useSelector(state => state.user);

  const {doesDeviceBackupDirExist, readDirectory} = useDevice();
  const {clearProject} = useResetState();
  const {getMyProjects} = useServerRequests();
  const toast = useToast();

  /* Internal Functions */

  const createProject = async (descriptionData) => {
    const newDate = new Date().toISOString();
    const id = getNewId();
    const currentProject = {
      id: id,
      description: descriptionData,
      date: newDate,
      modified_timestamp: Date.now(),
      other_features: DEFAULT_GEOLOGIC_TYPES,
      relationship_types: DEFAULT_RELATIONSHIP_TYPES,
      templates: {},
      useContinuousTagging: false,
    };
    dispatch(addedProjectDescription(currentProject));
    const defaultDataset = createDataset();
    dispatch(addedDataset(defaultDataset));
  };

  const getDatasetIdFromSpotId = (spotId) => {
    let datasetIdFound;
    for (const dataset of Object.values(datasets)) {
      const spotIdFound = dataset.spotIds?.find(id => id === spotId);
      if (spotIdFound) {
        datasetIdFound = dataset.id;
        break;
      }
    }
    // A Spot legitimately maps to no dataset at times (e.g. a just-split line before Save Edits adds it
    // to the target dataset); the sole caller treats undefined as "not read-only", so return quietly.
    return datasetIdFound;
  };

  /* Exported Functions */

  const addDataset = async (name) => {
    const datasetObj = createDataset(name);
    dispatch(addedDataset(datasetObj));
    console.log('Added datasets', datasets);
    return Promise.resolve();
  };

  const checkValidDateTime = (spot) => {
    if (!spot.properties.date || !spot.properties.time) {
      let date = spot.properties.date || spot.properties.time;
      if (!date) {
        date = new Date(Date.now());
        date.setMilliseconds(0);
      }
      spot.properties.date = spot.properties.time = date.toISOString();
      console.log('SPOT', spot);
      return spot;
    }
  };

  const createDataset = (name) => {
    const newDate = new Date().toISOString();
    const modifiedTimeStamp = Date.now();
    const id = getNewId();
    return {
      id: id,
      name: name ? name : 'Default',
      date: newDate,
      modified_timestamp: modifiedTimeStamp,
      spotIds: [],
      images: {
        imageIds: [],
      },
    };
  };

  const destroyDataset = async (id) => {
    try {
      if (datasets && datasets[id] && datasets[id].spotIds) {
        console.log(datasets[id].spotIds.length, 'Spot(s) in Dataset to Delete.');
        dispatch(deletedSpots(datasets[id].spotIds));     // ToDo Need to delete images for deleted Spots
      }
      dispatch(deletedDataset(id));
    }
    catch (err) {
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      dispatch(setIsStatusMessagesModalVisible(true));
      dispatch(clearedStatusMessages());
      console.log('Error Deleting Dataset.');
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Deleting Dataset.'));
    }
  };

  const getActiveDatasets = () => {
    const activeDatasets = activeDatasetsIds.map(datasetId => datasets[datasetId]);
    return activeDatasets.filter(activeDataset => !isEmpty(activeDataset));
  };

  const getAllDeviceProjects = async (directory) => {
    // const deviceProject = await doesDeviceDirExist(APP_DIRECTORIES.BACKUP_DIR).then((res) => {
    //   console.log(`${APP_DIRECTORIES.BACKUP_DIR} exists: ${res}`);
    //   if (res) {
    //     return readDirectory(APP_DIRECTORIES.BACKUP_DIR).then((files) => {
    //       console.log('Files on device', files);
    //       let id = 0;
    //       if (!isEmpty(files)) {
    //         const deviceFiles = files.map((file) => {
    //           return {id: id++, fileName: file};
    //         });
    //         return Promise.resolve({projects: deviceFiles});
    //       }
    //       else return Promise.resolve([]);
    //     });
    //   }
    //   else return res;
    // });
    // return Promise.resolve(deviceProject);
    let id = 0;
    const exists = await doesDeviceBackupDirExist(undefined);
    if (exists) {
      const res = await readDirectory(directory);
      const deviceFiles = res
        .filter(file => file !== 'AutoBackups')
        .map((file) => {
          return {id: id++, fileName: file};
        });
      const autoBackupFiles = await readDirectory(directory + 'AutoBackups/') || [];
      const autoBackupItems = autoBackupFiles
        .filter(file => file.endsWith('.json') && /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/.test(file))
        .sort((a, b) => {
          const tsA = a.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)?.[0] ?? '';
          const tsB = b.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)?.[0] ?? '';
          return tsB.localeCompare(tsA);
        })
        .map((file) => {
          const tsMatch = file.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
          const modified_timestamp = tsMatch[0].replace(/(\d{2})-(\d{2})-(\d{2})$/, '$1:$2:$3');
          const sanitizedName = file.slice(tsMatch.index + 20, -'.json'.length);
          const displayName = sanitizedName ? sanitizedName.replace(/_/g, ' ') : 'Auto Backup';
          return {displayName, fileName: 'AutoBackups/' + file, id: id++, isAutoBackup: true, modified_timestamp};
        });
      return {projects: [...deviceFiles, ...autoBackupItems]};
    }
    else console.log('Does not exist');
  };

  const getAllServerProjects = async () => {
    try {
      return await getMyProjects();
    }
    catch (err) {
      console.error(err);
    }
  };

  // Get target dataset, if none selected make one
  const getTargetDatasetFromId = () => {
    let targetDataset = datasets[targetDatasetId];
    if (isEmpty(targetDataset)) {
      const datasetToSelect = Object.values(datasets)?.[0];
      if (!isEmpty(datasetToSelect) && datasetToSelect.id) {
        dispatch(setActiveDatasets({bool: true, dataset: datasetToSelect.id}));
        dispatch(setTargetDataset(datasetToSelect.id));
      }
      else if (!__DEV__ && Platform.OS !== 'web') {
        alert('No Target Dataset. Creating a new Default Dataset.');
        targetDataset = createDataset();
        dispatch(addedDataset(targetDataset));
        dispatch(setActiveDatasets({bool: true, dataset: targetDataset.id}));
        dispatch(setTargetDataset(targetDataset.id));
      }
    }
    console.log('Target Dataset', targetDataset);
    return targetDataset;
  };

  const initializeNewProject = async (descriptionData) => {
    clearProject();
    await createProject(descriptionData);
    return Promise.resolve();
  };

  const isSpotInReadOnlyDataset = (spotId) => {
    const datasetId = getDatasetIdFromSpotId(spotId);
    return readOnlyDatasetsIds.includes(datasetId);
  };

  const makeDatasetCurrent = (datasetId) => {
    const datasetName = datasets[datasetId].name;
    toast.show(
      `Target Dataset switched to ${datasetName}!`,
      {
        type: 'warning',
        animationType: 'slide-in',
        duration: 3000,
        placement: 'top',
      });
    toast.hideAll();
    dispatch(setTargetDataset(datasetId));
  };

  const setSwitchValue = async (val, dataset) => {
    try {
      dispatch(setActiveDatasets({bool: val, dataset: dataset.id}));
      dispatch(clearedSpotsInMapExtentIds());
      if (!val && !isEmpty(selectedSpot) && dataset.spotIds?.includes(selectedSpot.properties.id)) {
        if (currentImageBasemap) dispatch(setCurrentImageBasemap(undefined));
        if (stratSection) dispatch(clearedStratSection());
        dispatch(clearedSelectedSpots());
      }
      if (!isEmpty(user.name) && val) return 'SWITCHED';  //TODO do we really need this return
    }
    catch (err) {
      console.log('Error setting switch value.');
    }
    dispatch(setLoadingStatus({view: 'modal', bool: false}));
  };

  return {
    addDataset,
    checkValidDateTime,
    createDataset,
    destroyDataset,
    getActiveDatasets,
    getAllDeviceProjects,
    getAllServerProjects,
    getTargetDatasetFromId,
    initializeNewProject,
    isSpotInReadOnlyDataset,
    makeDatasetCurrent,
    setSwitchValue,
  };
};

export default useProject;
