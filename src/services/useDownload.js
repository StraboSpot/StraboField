import {Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES} from './directories.constants';
import useDevice from './useDevice';
import useResetState from './useResetState';
import useServerRequests from './useServerRequests';
import {
  addedStatusMessage,
  clearedStatusMessages,
  removedLastStatusMessage,
  setIsErrorMessagesModalVisible,
  setIsProjectLoadSelectionModalVisible,
  setIsStatusMessagesModalVisible,
  setLoadingStatus,
  setStatusMessageModalTitle,
} from '../modules/home/home.slice';
import {useImages} from '../modules/images';
import {MAIN_MENU_ITEMS} from '../modules/main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage} from '../modules/main-menu-panel/mainMenuPanel.slice';
import {MAP_PROVIDERS} from '../modules/maps/maps.constants';
import {addedCustomMapsFromBackup} from '../modules/maps/maps.slice';
import {
  addedDatasets,
  addedNeededImagesToDataset,
  addedProject,
  setActiveDatasets,
  setSelectedDataset,
} from '../modules/project/projects.slice';
import {addedSpotsFromServer} from '../modules/spots/spots.slice';
import {setUserData} from '../modules/user/userProfile.slice';
import {isEmpty} from '../shared/Helpers';

const useDownload = () => {
  let customMapsToSave = {};
  let datasetsObjToSave = {};
  let imagesDownloadedCount = 0;
  let imagesFailedCount = 0;
  let spotsToSave = [];

  const dispatch = useDispatch();
  const encodedLogin = useSelector(state => state.user.encoded_login);
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const {endpoint, isSelected} = useSelector(state => state.connections.databaseEndpoint);
  const project = useSelector(state => state.project.project);

  const {doesDeviceDirectoryExist, downloadAndSaveProfileImage, downloadImageAndSave} = useDevice();
  const {gatherNeededImages} = useImages();
  const {clearProject} = useResetState();
  const {
    getDatasets,
    getDatasetSpots,
    getImageUrl,
    getProfile,
    getProfileImage,
    getProject,
    testCustomMapUrl,
  } = useServerRequests();

  const downloadDatasets = async (selectedProject, encodedLoginScoped) => {
    try {
      dispatch(addedStatusMessage('Downloading Datasets...'));
      const res = await getDatasets(selectedProject.id, encodedLoginScoped);
      const datasets = res?.datasets || [];
      if (datasets.length >= 1) {
        dispatch(setActiveDatasets({bool: true, dataset: datasets[0].id}));
        dispatch(setSelectedDataset(datasets[0].id));
      }
      datasetsObjToSave = Object.assign({},
        ...datasets.map(item => ({[item.id]: {...item, modified_timestamp: item.modified_timestamp || Date.now()}})));
      await doGetDatasetSpots(datasets, encodedLoginScoped);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Downloaded ' + spotsToSave.length + ' Spots\nDownloaded '
        + Object.keys(datasetsObjToSave).length + ' Datasets\nFinished Downloading Datasets'));
    }
    catch (e) {
      console.log('Error getting datasets...' + e);
      throw Error;
    }
  };

  // Download Project Properties
  const downloadProject = async (selectedProject, encodedLoginScoped) => {
    try {
      console.log('Downloading Project Properties...');
      dispatch(addedStatusMessage('Downloading Project Properties...'));
      const projectResponse = await getProject(selectedProject.id, encodedLoginScoped);
      if (!isEmpty(project)) clearProject();
      dispatch(addedProject(projectResponse));
      const customMaps = projectResponse.other_maps;
      console.log('Finished Downloading Project Properties.', projectResponse);
      if (projectResponse.other_maps && !isEmpty(projectResponse.other_maps)) loadCustomMaps(customMaps);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Finished Downloading Project Properties'));
    }
    catch (err) {
      console.error('Error Downloading Project Properties.', err);
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Downloading Project Properties. ' + err));
      throw Error;
    }
  };

  const downloadSpots = async (dataset, encodedLoginScoped) => {
    try {
      // console.log(dataset.name, ':', 'Downloading Spots...');
      const featureCollection = await getDatasetSpots(dataset.id, encodedLoginScoped);
      // console.log(dataset.name, ':', 'Finished Downloading Spots.');
      if (isEmpty(featureCollection) || !featureCollection.features) {
        // console.log(dataset.name, ': No Spots in dataset.');
      }
      else {
        const spotsDownloaded = featureCollection.features;
        const spotImages = await findNeededImages(spotsDownloaded, dataset);
        if (spotImages) datasetsObjToSave[dataset.id] = {...datasetsObjToSave[dataset.id], images: spotImages};
        spotsToSave.push(...spotsDownloaded);
        const spotIds = Object.values(spotsDownloaded).map(spot => spot.properties.id);
        datasetsObjToSave[dataset.id] = {...datasetsObjToSave[dataset.id], spotIds: spotIds};
        // console.log(dataset.name, ':', 'Got Spots', spotsDownloaded);
      }
    }
    catch (err) {
      console.error(dataset.name, ':', 'Error Downloading Spots.', err);
      dispatch(addedStatusMessage('Error Downloading Spots.' + err));
      throw Error;
    }
  };

  const downloadUserProfile = async (encodedLoginScoped = encodedLogin) => {
    try {
      let userProfileRes = await getProfile(encodedLoginScoped);

      if (Platform.OS === 'web') {
        const userProfileImageBlob = await getProfileImage(encodedLoginScoped);
        if (userProfileImageBlob) {
          const image = URL.createObjectURL(userProfileImageBlob);
          dispatch(setUserData({...userProfileRes, image: image, encoded_login: encodedLoginScoped}));
        }
        else dispatch(setUserData({...userProfileRes, encoded_login: encodedLoginScoped}));
      }
      else {
        await downloadAndSaveProfileImage(encodedLoginScoped);
        dispatch(setUserData({...userProfileRes, encoded_login: encodedLoginScoped}));
      }

      Sentry.setUser({'username': userProfileRes.name, 'email': userProfileRes.email});
    }
    catch (err) {
      throw Error(err);
    }
  };

  const findNeededImages = async (spotsDownloaded, dataset) => {
    try {
      // console.log(dataset.name, ':', 'Gathering Needed Images...');
      const spotImages = await gatherNeededImages(spotsDownloaded, dataset);
      if (spotImages?.imageIds.length > 0) {
        // console.log(dataset.name, ':', 'Images needed', spotImages.neededImagesIds.length, 'of', spotImages?.imageIds.length);
        return spotImages;
      }
      else {
        console.log(dataset.name, ':', 'No Images in dataset.');
        return undefined;
      }
    }
    catch (err) {
      console.error(dataset.name, ':', 'Error Gathering Images. Error:', err);
    }
  };

  const doGetDatasetSpots = async (datasets, encodedLoginScoped) => {
    if (datasets.length >= 1) {
      // console.log('Starting Dataset Spots Download!');

      // Synchronous download
      await datasets.reduce(async (previousPromise, dataset, i) => {
        await previousPromise;
        await downloadSpots(dataset, encodedLoginScoped);
      }, Promise.resolve());
    }
  };

  const initializeDownload = async (selectedProject, encodedLoginScoped = encodedLogin) => {
    const projectName = selectedProject.name || selectedProject?.description?.project_name || 'Unknown';
    if (isProjectLoadSelectionModalVisible) dispatch(setIsProjectLoadSelectionModalVisible(false));
    dispatch(setStatusMessageModalTitle(projectName));
    dispatch(clearedStatusMessages());
    if (Platform.OS !== 'web') dispatch(setIsStatusMessagesModalVisible(true));
    dispatch(setLoadingStatus({view: 'modal', bool: true}));
    dispatch(addedStatusMessage(`Downloading Project: ${projectName}`));
    try {
      await downloadProject(selectedProject, encodedLoginScoped);
      await downloadDatasets(selectedProject, encodedLoginScoped);
      console.log('Download Complete! Spots Downloaded!');
      dispatch(addedStatusMessage('------------------'));
      dispatch(addedSpotsFromServer(spotsToSave));
      dispatch(addedDatasets(datasetsObjToSave));
      dispatch(addedCustomMapsFromBackup(customMapsToSave));
      dispatch(addedStatusMessage('Complete!'));
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE.ACTIVE_PROJECTS}));
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
    }
    catch (err) {
      console.error('Error Initializing Download.', err);
      if (Platform.OS === 'web') {
        dispatch(clearedStatusMessages());
        dispatch(addedStatusMessage('Error loading project!', err));
        dispatch(setIsErrorMessagesModalVisible(true));
      }
      else dispatch(addedStatusMessage('Download Failed!', err));
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      throw Error;
    }
  };

  const initializeDownloadImages = async (dataset) => {
    try {
      const neededImagesIds = dataset.images?.neededImagesIds;
      let updatedNeededImagesIds = JSON.parse(JSON.stringify(neededImagesIds));
      dispatch(setLoadingStatus({view: 'modal', bool: true}));
      dispatch(clearedStatusMessages());
      dispatch(setIsStatusMessagesModalVisible(true));
      console.log('Downloading Needed Images...');
      dispatch(addedStatusMessage('Downloading Needed Images...'));
      if (!isEmpty(neededImagesIds)) {
        // Check path first and if it doesn't exist, then create
        await doesDeviceDirectoryExist(APP_DIRECTORIES.IMAGES);
        for (const imageId of updatedNeededImagesIds) {
          const imageUrl = await getImageUrl();
          const success = await downloadImageAndSave(imageUrl + imageId, imageId);
          if (success) {
            imagesDownloadedCount++;
            updatedNeededImagesIds = updatedNeededImagesIds.filter(id => id !== imageId);
            dispatch(addedNeededImagesToDataset({
              datasetId: dataset.id,
              images: {...dataset.images, neededImagesIds: updatedNeededImagesIds},
              modified_timestamp: dataset.modified_timestamp,
            }));
          }
          else imagesFailedCount++;
          console.log('New/Modified Images Saved: ' + imagesDownloadedCount + '/'
            + neededImagesIds.length + ' Images Failed: ' + imagesFailedCount + '/' + neededImagesIds.length);
          dispatch(removedLastStatusMessage());
          dispatch(addedStatusMessage('New/Modified Images Saved: ' + imagesDownloadedCount + ' / '
            + neededImagesIds.length + '\n Images Failed: ' + imagesFailedCount + '/' + neededImagesIds.length));
        }

        dispatch(removedLastStatusMessage());
        if (imagesFailedCount > 0) {
          dispatch(addedStatusMessage('Finished downloading images but with failures.\nDownloaded Images '
            + imagesDownloadedCount + '/' + neededImagesIds.length + '\nFailed Images ' + imagesFailedCount + '/'
            + neededImagesIds.length));
        }
        else {
          dispatch(
            addedStatusMessage('Finished downloading images: ' + imagesDownloadedCount + '/' + neededImagesIds.length));
          dispatch(setLoadingStatus({view: 'modal', bool: false}));
        }
        dispatch(addedStatusMessage('Complete!'));
        dispatch(addedStatusMessage('\nAll needed images have been downloaded for this dataset'));
        dispatch(setLoadingStatus({view: 'modal', bool: false}));
      }
    }
    catch (err) {
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Error Downloading Images!'));
      dispatch(addedStatusMessage('Complete!'));
      console.warn('Error Downloading Images: ' + err);
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
    }
  };

  const loadCustomMaps = (maps) => {
    maps.map(async (map) => {
      let mapId = map.id;
      // Pull out mapbox styles map id
      if (map.source === 'mapbox_styles' && map.id.includes('mapbox://styles/')) {
        mapId = map.id.split('/').slice(3).join('/');
      }
      let providerInfo = MAP_PROVIDERS[map.source];
      if (map.source === 'strabospot_mymaps') {
        if (!isEmpty(endpoint) && isSelected) {
          let tileEndpoint = endpoint.replace('/db', '/strabo_mymaps_check/');
          if (await testCustomMapUrl(tileEndpoint + map.id)) {
            tileEndpoint = endpoint.replace('/db', '/geotiff/tiles/');
            providerInfo = {...providerInfo, url: [tileEndpoint]};
          }
          else throw Error('Invalid IP address');
        }
      }
      const customMap = {
        ...map,
        ...providerInfo,
        id: mapId,
        key: map.accessToken || map.key,
        source: map.source,
      };
      console.log(customMap);
      customMapsToSave = {...customMapsToSave, [customMap.id]: customMap};
    });
  };

  return {
    downloadUserProfile: downloadUserProfile,
    initializeDownload: initializeDownload,
    initializeDownloadImages: initializeDownloadImages,
  };
};

export default useDownload;
