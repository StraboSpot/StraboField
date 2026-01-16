import {Linking} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {updatedProjectTransferProgress} from './connections.slice';
import {handleResponse, post, request, requestMicro, timeoutPromise} from './serverRequestHelpers';
import {MICRO_PATHS, ORCID_PATHS, SESAR_PATHS, STRABO_APIS} from './urls.constants';
import alert from '../shared/ui/alert';
import {userAgent} from './userAgent';

const useServerRequests = () => {
  const dispatch = useDispatch();
  const {endpoint, isSelected} = useSelector(state => state.connections.databaseEndpoint);

  const baseUrl = endpoint && isSelected ? endpoint : STRABO_APIS.DB;
  const domain = endpoint && isSelected ? endpoint : STRABO_APIS.STRABO;
  const tilehost = STRABO_APIS.TILE_HOST;
  const {SESAR_API, GET_TOKEN, GET_USER_CODE, REFRESH_TOKEN} = SESAR_PATHS;
  const {ORCID, AUTH, SCOPE, REDIRECT_URL} = ORCID_PATHS;

  const {encoded_login, sesar} = useSelector(state => state.user);

  const addDatasetToProject = (projectId, datasetId) => {
    return post(baseUrl, `/projectDatasets/${projectId}`, encoded_login, {id: datasetId});
  };

  const authenticateUser = async (username, password) => {
    const authenticationBaseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/'));
    const response = await timeoutPromise(60000, fetch(`${authenticationBaseUrl}/userAuthenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
      body: JSON.stringify({email: username, password: password}),
    }));
    return handleResponse(response);
  };

  const deleteAccount = async (login) => {
    try {
      const response = await fetch(`${baseUrl}${STRABO_APIS.ACCOUNT}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${login}`,
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
        },
      });
      return handleResponse(response);
    }
    catch (err) {
      console.error('Error Deleting Account', err);
      alert('Error', `${err.toString()}`);
    }
  };

  const deleteAllSpotsInDataset = (datasetId) => {
    return request(baseUrl, 'DELETE', `/datasetSpots/${datasetId}`, encoded_login);
  };

  const deleteProfileImage = async (login) => {
    try {
      const response = await fetch(`${baseUrl}/profileimage`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${login}`,
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
        },
      });
      return handleResponse(response);
    }
    catch (err) {
      console.error('Error Deleting Profile Image', err);
      alert('Error', `${err.toString()}`);
    }
  };

  const getDatasets = (projectId, encodedLogin) => {
    return request(baseUrl, 'GET', `/projectDatasets/${projectId}`, encodedLogin);
  };

  const getDatasetSpots = (datasetId, encodedLogin) => {
    return request(baseUrl, 'GET', `/datasetSpots/${datasetId}`, encodedLogin);
  };

  const getImage = (imageId) => {
    const imageUrl = isSelected ? baseUrl.replace('/db', '/pi/') : `${STRABO_APIS.STRABO}/pi/`;
    return fetch(`${imageUrl}${imageId}`, {
      method: 'GET',
      responseType: 'blob',
      headers: {
        'Authorization': `Basic ${encoded_login}`,
        'Accept': 'application/json',
        'User-Agent': userAgent,
      },
    });
  };

  const getMacrostratData = async (location) => {
    const params = {lng: location.coords[0].toFixed(4), lat: location.coords[1].toFixed(4)};
    const url = `https://macrostrat.org/api/v2/mobile/point?${new URLSearchParams(params).toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {'User-Agent': userAgent},
    });
    return handleResponse(response);
  };

  const getMapTilesFromHost = async (zipUrl) => {
    const response = await timeoutPromise(60000, fetch(zipUrl));
    return response.json();
  };

  const getMyMapsBbox = async (mapUrl) => {
    const response = await fetch(mapUrl);
    return handleResponse(response);
  };

  const getMyMicroProjects = () => {
    return requestMicro(domain, 'GET', MICRO_PATHS.MY_PROJECTS, encoded_login);
  };

  const getMyProjects = () => {
    return request(baseUrl, 'GET', '/myProjects', encoded_login);
  };

  const getOrcidToken = async () => {
    try {
      const url = `${ORCID}${AUTH}${SCOPE}${REDIRECT_URL}${encodeURIComponent(encoded_login)}`;
      await Linking.openURL(url);
    }
    catch (err) {
      console.error('Error Getting ORCID Token', err);
      alert('Error Getting ORCID Token', `${err.toString()}`);
    }
  };

  const getProfile = async (encodedLogin) => {
    const response = await timeoutPromise(10000, fetch(`${baseUrl}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedLogin}/`,
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
    }));
    return handleResponse(response);
  };

  const getProfileImage = async (encodedLogin) => {
    try {
      const imageResponse = await fetch(`${baseUrl}/profileimage`, {
        method: 'GET',
        responseType: 'blob',
        headers: {
          'Authorization': `Basic ${encodedLogin}`,
          'User-Agent': userAgent,
        },
      });
      if (imageResponse.status === 200) return imageResponse.blob();
      return null;
    }
    catch (error) {
      console.error('Error Getting Profile Image', error);
      return null;
    }
  };

  const getProfileImageURL = () => `${baseUrl}/profileimage`;

  const getProject = (projectId, encodedLogin) => {
    return request(baseUrl, 'GET', `/project/${projectId}`, encodedLogin);
  };

  const getSesarToken = async (orcidToken) => {
    const formData = new FormData();
    formData.append('connection', 'strabospot');
    formData.append('orcid_id_token', orcidToken);
    const res = await fetch(`${SESAR_API}${GET_TOKEN}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'User-Agent': userAgent,
      },
      body: formData,
    });
    const sesarJson = await res.json();
    if (sesarJson.error) {
      console.error('SESAR Token Error', sesarJson.error);
      throw Error(sesarJson.error);
    }
    return sesarJson;
  };

  const getSesarUserCode = async (accessToken) => {
    const userCodeXmlRes = await fetch(`${SESAR_API}${GET_USER_CODE}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': userAgent,
      },
    });
    return userCodeXmlRes.text();
  };

  const getTileCountFromHost = async (url) => {
    const response = await timeoutPromise(10000, fetch(url));
    return response.json();
  };

  const getTilehostUrl = () => isSelected ? baseUrl.replace('/db', '/strabotiles') : tilehost;

  const postToSesar = async (xmlData) => {
    return sendToSesar(xmlData, SESAR_PATHS.UPLOAD);
  };

  const refreshSesarToken = async (accessToken) => {
    const formData = new FormData();
    formData.append('refresh', accessToken);
    const res = await fetch(`${SESAR_API}${REFRESH_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent,
      },
      body: formData,
    });
    return res.json();
  };

  const registerUser = async (newAccountInfo) => {
    const newAccount = JSON.stringify({
      first_name: newAccountInfo.firstName.value,
      last_name: newAccountInfo.lastName.value,
      email: newAccountInfo.email.value,
      password: newAccountInfo.password.value,
      confirm_password: newAccountInfo.confirmPassword.value,
    });
    const modifiedBaseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/'));
    const response = await fetch(`${modifiedBaseUrl}/userRegister`, {
      method: 'POST',
      body: newAccount,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
    });
    return handleResponse(response);
  };

  const sendToSesar = async (xmlData, sesarPath) => {
    try {
      return await fetch(`${SESAR_API}${sesarPath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sesar.sesarToken.access}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': userAgent,
        },
        body: xmlData,
      });
    }
    catch (err) {
      console.error('Error Posting to SESAR', err);
      alert('Error Posting to SESAR', `${err.toString()}`);
    }
  };

  const testCustomMapUrl = async (mapURL) => {
    try {
      const res = await fetch(mapURL);
      return res.ok;
    }
    catch (e) {
      console.error('Error Testing Custom Map URL', e);
      return false;
    }
  };

  const updateDataset = (dataset) => {
    return post(baseUrl, '/dataset', encoded_login, dataset);
  };

  const updateDatasetSpots = (datasetId, spotCollection) => {
    return post(baseUrl, `/datasetspots/${datasetId}`, encoded_login, spotCollection);
  };

  const updateProfile = (data) => {
    return post(baseUrl, '/profile', encoded_login, data);
  };

  const updateProject = (project) => {
    return post(baseUrl, '/project', encoded_login, project);
  };

  const updateSampleWithSesar = async (xmlData) => {
    return sendToSesar(xmlData, SESAR_PATHS.UPDATE);
  };

  const uploadImage = (formdata, isProfileImage) => {
    const uploadProgress = (event) => {
      const percentage = Math.floor((event.loaded / event.total) * 100);
      console.log(`UPLOAD IS ${percentage}% DONE!`);
      dispatch(updatedProjectTransferProgress(event.loaded / event.total));
    };

    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', uploadProgress);
      xhr.addEventListener('load', () => {
        if (xhr.status === 404) reject(false);
        else resolve(xhr.response);
      });
      xhr.addEventListener('error', (e) => {
        console.error('Error Uploading Image', e);
        reject(false);
      });

      xhr.open('POST', `${baseUrl}${isProfileImage ? '/profileImage' : '/image'}`);
      xhr.setRequestHeader('Content-Type', 'multipart/form-data');
      xhr.setRequestHeader('Authorization', `Basic ${encoded_login}`);
      xhr.setRequestHeader('User-Agent', userAgent);
      xhr.send(formdata);
    });
  };

  const uploadWebImage = async (formData) => {
    const response = await fetch(`${baseUrl}/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encoded_login}`,
        'User-Agent': userAgent,
      },
      body: formData,
    });
    return handleResponse(response);
  };

  const verifyImagesExistence = async (imageIdsArray) => {
    const response = await timeoutPromise(60000, fetch(`${baseUrl}/verifyImages/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encoded_login}/`,
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
      body: JSON.stringify(imageIdsArray),
    }));
    return handleResponse(response);
  };

  const zipURLStatus = async (zipId) => {
    try {
      const myMapsEndpoint = isSelected ? endpoint.replace('/db', '/strabotiles') : tilehost;
      const response = await timeoutPromise(60000, fetch(`${myMapsEndpoint}/asyncstatus/${zipId}`));
      const responseJson = await response.json();
      if (responseJson.error) throw Error(responseJson.error);
      return responseJson;
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
    getMapTilesFromHost,
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
    getTileCountFromHost,
    getTilehostUrl,
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
