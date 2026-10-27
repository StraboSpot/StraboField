import {Linking, Platform} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {
  deleteRequest,
  getDeviceIdHeader,
  getRequest,
  postFormDataRequest,
  postRequest,
  timeoutPromise,
} from './serverRequests.helpers';
import {MACROSTRAT_PATHS, MICRO_PATHS, SAMPLES_PATHS, STRABO_APIS} from './urls.constants';
import {userAgent} from './userAgent.constants';
import {updatedProjectTransferProgress} from '../../modules/connections/connections.slice';
import {MISSING_STRABO_USER_ID_MESSAGE} from '../../modules/samples/samples.constants';
import {toError} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {store} from '../../store/ConfigureStore';

const useServerRequests = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {encoded_login} = useSelector(state => state.user);
  const {endpoint, isSelected} = useSelector(state => state.connections.databaseEndpoint);

  /* Derived Variables */

  // URL Helpers
  const {SPOT_CHECKIN, SPOT_CONVERSION, LOGIN, REDIRECT_URI} = MACROSTRAT_PATHS;
  const baseUrl = endpoint && isSelected ? endpoint : STRABO_APIS.DB;
  const domain = endpoint && isSelected ? endpoint : STRABO_APIS.STRABO;
  const tilehost = STRABO_APIS.TILE_HOST;

  /* Internal Functions */

  const basicAuth = (token = encoded_login) => ({type: 'basic', token});

  const getImageBaseUrl = () => isSelected ? baseUrl.replace('/db', '/pi/') : `${STRABO_APIS.STRABO}/pi/`;

  /* Exported Functions */

  const addDatasetToProject = (projectId, datasetId) =>
    postRequest(`${baseUrl}/projectDatasets/${projectId}`, {id: datasetId}, basicAuth());

  const authenticateUser = (username, password) => {
    const authUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/'));
    return postRequest(`${authUrl}/userAuthenticate`, {email: username, password: password}, null);
  };

  const deleteAccount = login => deleteRequest(`${baseUrl}${STRABO_APIS.ACCOUNT}`, basicAuth(login));

  const deleteAllSpotsInDataset = datasetId => deleteRequest(`${baseUrl}/datasetSpots/${datasetId}`, basicAuth());

  const deleteProfileImage = login => deleteRequest(`${baseUrl}/profileimage`, basicAuth(login));

  const getDatasets = (projectId, encodedLogin) =>
    getRequest(`${baseUrl}/projectDatasets/${projectId}`, basicAuth(encodedLogin));

  const getDatasetSpots = (datasetId, encodedLogin) =>
    getRequest(`${baseUrl}/datasetSpots/${datasetId}`, basicAuth(encodedLogin));

  const getImage = async (imageId) => {
    try {
      const response = await getRequest(`${getImageBaseUrl()}${imageId}`, basicAuth(), {responseType: 'blob'});
      return response.status === 200 ? response.blob() : null;
    }
    catch (err) {
      console.error('Error Getting Image', err);
      return null;
    }
  };

  //MacroStrat API
  const convertSpotToMacrostrat = (spot) => {
    return postRequest(SPOT_CONVERSION, spot, null, {});
  };

  const getMacrostratData = (location) => {
    const params = {lng: location.coords[0].toFixed(4), lat: location.coords[1].toFixed(4)};
    return getRequest(`https://macrostrat.org/api/v2/mobile/point?${new URLSearchParams(params).toString()}`, null);
  };

  const openMacrostratLogin = async () => {
    try {
      await Linking.openURL(`${LOGIN}?redirect_uri=${encodeURIComponent(REDIRECT_URI)}`);
    }
    catch (err) {
      console.error('Error opening Rockd login', err);
      alert('Error opening Rockd login', err.toString());
    }
  };

  const postCheckinToRockd = (spotCheckIn) => {
    return postRequest(SPOT_CHECKIN, spotCheckIn, null, {});
  };

  // const postCheckinImageToRockd = (spotCheckIn, image) => {
  //
  // };

  // A public endpoint, so no auth - but through getRequest like everything else, for its timeout and the
  // User-Agent identifying the app.
  const getMyMapsBbox = mapUrl => getRequest(mapUrl);

  const getMyMicroProjects = () => getRequest(`${domain}${MICRO_PATHS.MY_PROJECTS}`, basicAuth());

  // The samples API sits beside /db on the same server, so a custom endpoint gets it too
  const getSamplesBaseUrl = () => baseUrl.replace(/\/db\/?$/, '');

  // Leave out the samples already in Field, so only the Micro and Experimental samples are offered to link
  const getMySamples = () => getRequest(
    `${getSamplesBaseUrl()}${SAMPLES_PATHS.MY_SAMPLES}?omit=field&include_subsystem_flags=1`, basicAuth());

  const getMyProjects = () => getRequest(`${baseUrl}/myProjects`, basicAuth());

  const getProfile = encodedLogin => getRequest(`${baseUrl}/profile`, basicAuth(encodedLogin));

  const getProfileImage = async (encodedLogin) => {
    try {
      const response = await getRequest(`${baseUrl}/profileimage`, basicAuth(encodedLogin), {responseType: 'blob'});
      return response.status === 200 ? response.blob() : null;
    }
    catch (err) {
      console.error('Error Getting Profile Image', err);
      return null;
    }
  };

  const getProfileImageURL = () => `${baseUrl}/profileimage`;

  const getProject = (projectId, encodedLogin) =>
    getRequest(`${baseUrl}/project/${projectId}`, basicAuth(encodedLogin));

  // Without the owner's userpkey, a sample shared by a collaborator is a 404. With no owner given, it's the user's own,
  // read from the store since a profile just loaded by a sign-in isn't in this render yet.
  const getStraboSample = async (id, ownerId, encodedLogin) => {
    const owner = ownerId || store.getState().user.straboUserId;
    if (!owner) throw Error(MISSING_STRABO_USER_ID_MESSAGE);
    return getRequest(`${getSamplesBaseUrl()}${SAMPLES_PATHS.SAMPLE}${encodeURIComponent(id)}?owner=${encodeURIComponent(owner)}`,
      basicAuth(encodedLogin));
  };

  const getTileBaseUrl = () => isSelected ? endpoint.replace('/db', '/strabotiles') : tilehost;

  const getTilesFromHost = async (url) => {
    const response = await timeoutPromise(fetch(url));
    return response.json();
  };

  const registerUser = (newAccountInfo) => {
    const registerUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/'));
    return postRequest(`${registerUrl}/userRegister`, {
      first_name: newAccountInfo.firstName.value,
      last_name: newAccountInfo.lastName.value,
      email: newAccountInfo.email.value,
      password: newAccountInfo.password.value,
      confirm_password: newAccountInfo.confirmPassword.value,
    }, null);
  };

  const testCustomMapUrl = async (mapURL) => {
    try {
      const response = await fetch(mapURL, {headers: getDeviceIdHeader(mapURL)});
      return response.ok;
    }
    catch (err) {
      console.error('Error Testing Custom Map URL', err);
      return false;
    }
  };

  const updateDataset = dataset => postRequest(`${baseUrl}/dataset`, dataset, basicAuth());

  const updateDatasetSpots = (datasetId, spotCollection) =>
    postRequest(`${baseUrl}/datasetspots/${datasetId}`, spotCollection, basicAuth(), {}, 300000);

  const updateProfile = data => postRequest(`${baseUrl}/profile`, data, basicAuth());

  const updateProject = project => postRequest(`${baseUrl}/project`, project, basicAuth());

  const uploadImage = (formdata, isProfileImage) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        console.log(`UPLOAD IS ${Math.floor((event.loaded / event.total) * 100)}% DONE!`);
        dispatch(updatedProjectTransferProgress(event.loaded / event.total));
      });
      xhr.addEventListener('load', () => xhr.status === 404 ? reject(false) : resolve(xhr.response));
      xhr.addEventListener('error', (err) => {
        console.error('Error Uploading Image', err);
        reject(false);
      });
      const url = `${baseUrl}${isProfileImage ? '/profileImage' : '/image'}`;
      xhr.open('POST', url);
      xhr.setRequestHeader('Content-Type', 'multipart/form-data');
      xhr.setRequestHeader('Authorization', `Basic ${encoded_login}`);
      Object.entries(getDeviceIdHeader(url)).forEach(([name, value]) => xhr.setRequestHeader(name, value));
      //xhr.setRequestHeader('User-Agent', userAgent);

      //User-Agent is a forbidden header in the browser Fetch API — the browser sets it automatically and does not allow JavaScript to override it.
      if (Platform.OS !== 'web') xhr.setRequestHeader('User-Agent', userAgent);

      xhr.send(formdata);
    });
  };

  const uploadWebImage = formData => postFormDataRequest(`${baseUrl}/image`, formData, basicAuth());

  const verifyImagesExistence = imageIdsArray => postRequest(`${baseUrl}/verifyImages/`, imageIdsArray, basicAuth());

  const zipURLStatus = async (zipId) => {
    try {
      const response = await timeoutPromise(fetch(`${getTileBaseUrl()}/asyncstatus/${zipId}`));
      const json = await response.json();
      if (json.error) throw Error(json.error);
      return json;
    }
    catch (err) {
      console.error('Error in zipURLStatus', err);
      throw toError(err);
    }
  };

  return {
    addDatasetToProject,
    authenticateUser,
    deleteAccount,
    deleteAllSpotsInDataset,
    deleteProfileImage,
    getDatasets,
    getDatasetSpots,
    getImage,
    getMacrostratData,
    openMacrostratLogin,
    getMyMapsBbox,
    getMyMicroProjects,
    getMyProjects,
    getMySamples,
    getProfile,
    getProfileImage,
    getProfileImageURL,
    getProject,
    getStraboSample,
    getTileBaseUrl,
    getTilesFromHost,
    convertSpotToMacrostrat,
    postCheckinToRockd,
    registerUser,
    testCustomMapUrl,
    updateDataset,
    updateDatasetSpots,
    updateProfile,
    updateProject,
    uploadImage,
    uploadWebImage,
    verifyImagesExistence,
    zipURLStatus,
  };
};

export default useServerRequests;
