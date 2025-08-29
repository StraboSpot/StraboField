import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import * as ProjectActions from './project.constants';
import {DEFAULT_GEOLOGIC_TYPES, DEFAULT_RELATIONSHIP_TYPES} from './project.constants';
import {
  addedDataset,
  addedProjectDescription,
  deletedDataset,
  setActiveDatasets,
  setSelectedProject,
  setTargetDataset,
} from './projects.slice';
import useDevice from '../../services/useDevice';
import useDownload from '../../services/useDownload';
import useImport from '../../services/useImport';
import useResetState from '../../services/useResetState';
import useServerRequests from '../../services/useServerRequests';
import {getNewId, isEmpty} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import {
  addedStatusMessage,
  clearedStatusMessages,
  removedLastStatusMessage,
  setIsBackupModalVisible,
  setIsErrorMessagesModalVisible,
  setIsProgressModalVisible,
  setIsStatusMessagesModalVisible,
  setLoadingStatus,
} from '../home/home.slice';
import {clearedSpotsInMapExtentIds, clearedStratSection, setCurrentImageBasemap} from '../maps/maps.slice';
import {clearedSelectedSpots, deletedSpots} from '../spots/spots.slice';

const useProject = () => {
  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const datasets = useSelector(state => state.project.datasets) || {};
  const selectedProject = useSelector(state => state.project.selectedProject) || {};
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const stratSection = useSelector(state => state.map.stratSection);
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);
  const user = useSelector(state => state.user);

  const toast = useToast();
  const {doesDeviceBackupDirExist, readDirectory} = useDevice();
  const {initializeDownload} = useDownload();
  const {loadProjectFromDevice} = useImport();
  const {clearProject} = useResetState();
  const {getMyProjects} = useServerRequests();

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
        neededImagesIds: [],
        imageIds: [],
      },
    };
  };

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

  const destroyDataset = async (id) => {
    try {
      dispatch(setIsStatusMessagesModalVisible(true));
      dispatch(setLoadingStatus({view: 'modal', bool: true}));
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Deleting Dataset...'));
      if (datasets && datasets[id] && datasets[id].spotIds) {
        console.log(datasets[id].spotIds.length, 'Spot(s) in Dataset to Delete.');
        dispatch(deletedSpots(datasets[id].spotIds));
        // ToDo Need to delete images for deleted Spots
      }
      dispatch(deletedDataset(id));
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Finished Deleting Dataset.'));
    }
    catch (err) {
      console.log('Error Deleting Dataset.');
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Deleting Dataset.'));
    }
    dispatch(setLoadingStatus({view: 'modal', bool: false}));
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
      const deviceFiles = res.map((file) => {
        return {id: id++, fileName: file};
      });
      return {projects: deviceFiles};
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

  // const getDatasetFromSpotId = (spotId) => {
  //   let datasetIdFound;
  //   for (const dataset of Object.values(datasets)) {
  //     const spotIdFound = dataset.spotIds.find(id => id === spotId);
  //     if (spotIdFound) {
  //       datasetIdFound = dataset.id;
  //       break;
  //     }
  //   }
  //   console.log('HERE IS THE DATASET', datasetIdFound);
  //   if (!datasetIdFound) console.error('Dataset not found');
  //   return datasetIdFound;
  // };

  // Get target dataset, if none selected make one
  const getTargetDatasetFromId = () => {
    let targetDataset = datasets[targetDatasetId];
    if (isEmpty(targetDataset)) {
      const datasetToSelect = Object.values(datasets)?.[0];
      if (!isEmpty(datasetToSelect) && datasetToSelect.id) {
        dispatch(setActiveDatasets({bool: true, dataset: datasetToSelect.id}));
        dispatch(setTargetDataset(datasetToSelect.id));
      }
      else {
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

  const switchProject = async (action) => {
    try {
      console.log('User wants to:', action);
      if (action === ProjectActions.BACKUP_TO_SERVER) dispatch(setIsProgressModalVisible(true));
      else if (action === ProjectActions.BACKUP_TO_DEVICE) dispatch(setIsBackupModalVisible(true));
      else if (action === ProjectActions.OVERWRITE) {
        if (selectedProject.source === 'device') {
          dispatch(setSelectedProject({project: '', source: ''}));
          dispatch(clearedStatusMessages());
          dispatch(setIsStatusMessagesModalVisible(true));
          dispatch(setLoadingStatus({view: 'modal', bool: true}));
          const res = await loadProjectFromDevice(selectedProject.project.fileName);
          dispatch(setLoadingStatus({view: 'modal', bool: false}));
          console.log('Done loading project', res);
        }
        else if (selectedProject.source === 'server') {
          dispatch(setSelectedProject({project: '', source: ''}));
          await initializeDownload(selectedProject.project);
        }
      }
    }
    catch (err) {
      dispatch(setIsStatusMessagesModalVisible(false));
      console.error('Error switching project in useProject', err);
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage(`There was an error loading the project. \n\nMessage:\n${err}`));
      dispatch(setIsErrorMessagesModalVisible(true));
      throw Error('Project Error');
    }
  };

  return {
    addDataset: addDataset,
    checkValidDateTime: checkValidDateTime,
    destroyDataset: destroyDataset,
    getActiveDatasets: getActiveDatasets,
    getAllDeviceProjects: getAllDeviceProjects,
    getAllServerProjects: getAllServerProjects,
    getTargetDatasetFromId: getTargetDatasetFromId,
    initializeNewProject: initializeNewProject,
    makeDatasetCurrent: makeDatasetCurrent,
    setSwitchValue: setSwitchValue,
    switchProject: switchProject,
  };
};

export default useProject;
