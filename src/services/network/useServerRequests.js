import {Linking, Platform} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {
  deleteRequest,
  getRequest,
  handleResponse,
  postFormDataRequest,
  postRequest,
  timeoutPromise,
} from './serverRequests.helpers';
import {MACROSTRAT_PATHS, MICRO_PATHS, ORCID_PATHS, SESAR_PATHS, STRABO_APIS} from './urls.constants';
import {userAgent} from './userAgent.constants';
import {updatedProjectTransferProgress} from '../../modules/connections/connections.slice';
import alert from '../../shared/ui/alert';

const useServerRequests = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {encoded_login, sesar} = useSelector(state => state.user);
  const {endpoint, isSelected} = useSelector(state => state.connections.databaseEndpoint);

  /* Derived Variables */

  // URL Helpers
  const {SPOT_CHECKIN, SPOT_CONVERSION, LOGIN, REDIRECT_URI} = MACROSTRAT_PATHS;
  const baseUrl = endpoint && isSelected ? endpoint : STRABO_APIS.DB;
  const domain = endpoint && isSelected ? endpoint : STRABO_APIS.STRABO;
  const tilehost = STRABO_APIS.TILE_HOST;

  /* Internal Functions */

  const basicAuth = (token = encoded_login) => ({type: 'basic', token});

  const bearerAuth = token => ({type: 'bearer', token});

  const getImageBaseUrl = () => isSelected ? baseUrl.replace('/db', '/pi/') : `${STRABO_APIS.STRABO}/pi/`;

  const sendToSesar = async (data, path) => {
    try {
      return await postRequest(`${SESAR_PATHS.SESAR_API}${path}`, data, bearerAuth(sesar.sesarToken.access),
        {'Content-Type': 'application/x-www-form-urlencoded'});
    }
    catch (err) {
      // Re-throw a clean, user-facing message so the caller (registerSample) surfaces it on the error view.
      // Previously this swallowed the error and returned undefined, causing a downstream `undefined.text()` crash.
      console.error('Error Posting to SESAR', err);
      throw new Error(err?.message === 'Network timeout'
        ? 'SESAR did not respond (network timeout). Please check your connection and try again.'
        : 'Unable to reach SESAR. Please check your Internet connection and try again.');
    }
  };

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

  const getMyMapsBbox = async (mapUrl) => {
    const response = await fetch(mapUrl);
    return handleResponse(response);
  };

  const getMyMicroProjects = () => getRequest(`${domain}${MICRO_PATHS.MY_PROJECTS}`, basicAuth());

  const getMyProjects = () => getRequest(`${baseUrl}/myProjects`, basicAuth());

  const getOrcidToken = async () => {
    try {
      const {ORCID, AUTH, SCOPE, REDIRECT_URL} = ORCID_PATHS;
      await Linking.openURL(`${ORCID}${AUTH}${SCOPE}${REDIRECT_URL}${encodeURIComponent(encoded_login)}`);
    }
    catch (err) {
      console.error('Error Getting ORCID Token', err);
      alert('Error Getting ORCID Token', err.toString());
    }
  };

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

  const getSesarToken = async (orcidToken) => {
    const formData = new FormData();
    formData.append('connection', 'strabospot');
    formData.append('orcid_id_token', orcidToken);
    const response = await postRequest(`${SESAR_PATHS.SESAR_API}${SESAR_PATHS.GET_TOKEN}`, formData, null,
      {'Accept': 'application/json'});
    const json = await response.json();
    if (json.error) {
      console.error('SESAR Token Error', json.error);
      throw Error(json.error);
    }
    return json;
  };

  const getSesarUserCode = async (accessToken) => {
    const response = await getRequest(`${SESAR_PATHS.SESAR_API}${SESAR_PATHS.GET_USER_CODE}`,
      bearerAuth(accessToken), {responseType: 'text'});
    return response.text();
  };

  const getTileBaseUrl = () => isSelected ? endpoint.replace('/db', '/strabotiles') : tilehost;

  const getTilesFromHost = async (url) => {
    const response = await timeoutPromise(fetch(url));
    return response.json();
  };

  const postToSesar = xmlData => sendToSesar(xmlData, SESAR_PATHS.UPLOAD);

  const refreshSesarToken = async (accessToken) => {
    const formData = new FormData();
    formData.append('refresh', accessToken);
    const response = await postRequest(`${SESAR_PATHS.SESAR_API}${SESAR_PATHS.REFRESH_TOKEN}`, formData, null,
      {'Content-Type': 'application/x-www-form-urlencoded'});
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
      const response = await fetch(mapURL);
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

  const updateSampleWithSesar = xmlData => sendToSesar(xmlData, SESAR_PATHS.UPDATE);

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
      xhr.open('POST', `${baseUrl}${isProfileImage ? '/profileImage' : '/image'}`);
      xhr.setRequestHeader('Content-Type', 'multipart/form-data');
      xhr.setRequestHeader('Authorization', `Basic ${encoded_login}`);
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
      throw new Error(err);
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
    getOrcidToken,
    getProfile,
    getProfileImage,
    getProfileImageURL,
    getProject,
    getSesarToken,
    getSesarUserCode,
    getTileBaseUrl,
    getTilesFromHost,
    convertSpotToMacrostrat,
    postCheckinToRockd,
    postToSesar,
    refreshSesarToken,
    registerUser,
    testCustomMapUrl,
    updateDataset,
    updateDatasetSpots,
    updateProfile,
    updateProject,
    updateSampleWithSesar,
    uploadImage,
    uploadWebImage,
    verifyImagesExistence,
    zipURLStatus,
  };
};

export default useServerRequests;
