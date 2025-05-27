import {Linking} from 'react-native';

import * as Sentry from '@sentry/react-native';
import {useDispatch, useSelector} from 'react-redux';

import {updatedProjectTransferProgress} from './connections.slice';
import {MICRO_PATHS, STRABO_APIS, ORCID_PATHS, SESAR_PATHS} from './urls.constants';
import alert from '../shared/ui/alert';

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
    return post('/projectDatasets/' + projectId, encoded_login, {id: datasetId});
  };

  const authenticateUser = async (username, password) => {
    const authenticationBaseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/')); //URL to send authentication API call
    let response = await timeoutPromise(60000, fetch(authenticationBaseUrl + '/userAuthenticate',
      {
        method: 'POST',
        headers: {
          // TODO: ?? does not work when Accept is uncommented ??
          // Accept: 'application/json; charset=UTF-8',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {email: username, password: password},
        ),
      },
    ));
    return handleResponse(response);
  };

  const deleteAllSpotsInDataset = (datasetId) => {
    return request('DELETE', '/datasetSpots/' + datasetId, encoded_login);
  };

  const deleteProfile = async (login) => {
    try {
      const response = await fetch(
        baseUrl + STRABO_APIS.ACCOUNT,
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Basic ' + login,
            'Content-Type': 'application/json',
          },
        });
      return handleResponse(response);
    }
    catch (err) {
      console.error('Error Posting', err);
      alert('Error', `${err.toString()}`);
    }
  };

  const deleteProfileImage = async (login) => {
    try {
      const response = await fetch(
        baseUrl + '/profileimage',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Basic ' + login,
            'Content-Type': 'application/json',
          },
        });
      return handleResponse(response);
    }
    catch (err) {
      console.error('Error Posting', err);
      alert('Error', `${err.toString()}`);
    }
  };

  // const deleteProject = async (project) => {
  //   try {
  //     const response = await fetch(
  //       baseUrl + '/project/' + project.id,
  //       {
  //         method: 'DELETE',
  //         headers: {
  //           'Authorization': 'Basic ' + encoded_login,
  //           'Content-Type': 'application/json',
  //         },
  //       },
  //     );
  //
  //     return handleResponse(response);
  //   }
  //   catch (err) {
  //     console.error('Error deleting project in useServerRequests', err);
  //   }
  // };

  const downloadImage = (imageId) => {
    return request('GET', '/image/' + imageId, encoded_login, {responseType: 'blob'});
  };

  const getDataset = (datasetId) => {
    return request('GET', '/dataset/' + datasetId);
  };

  const getDatasetSpots = (datasetId, encodedLogin) => {
    return request('GET', '/datasetSpots/' + datasetId, encodedLogin);
  };

  const getDatasets = async (projectId, encodedLogin) => {
    return request('GET', '/projectDatasets/' + projectId, encodedLogin);
  };

  const getDbUrl = () => {
    return baseUrl;
  };

  const getImage = async (imageId) => {
    const imageUrl = getImageUrl();
    return await fetch(imageUrl + imageId, {
      method: 'GET',
      responseType: 'blob',
      headers: {
        'Authorization': 'Basic ' + encoded_login,
        'Accept': 'application/json',
      },
    });
  };

  const getImageUrl = () => {
    if (isSelected) return baseUrl.replace('/db', '/pi/');
    return `${STRABO_APIS.STRABO}/pi/`;
  };

  const getMacrostratData = async (location) => {
    const params = {
      lng: location.coords[0].toFixed(4),
      lat: location.coords[1].toFixed(4),
    };
    const url = `https://macrostrat.org/api/v2/mobile/point?${new URLSearchParams(params).toString()}`;
    console.log(url);
    const response = await fetch(url, {
      method: 'GET',
    });
    return handleResponse(response);
  };

  const getTileCountFromHost = async (url) => {
    const response = await timeoutPromise(10000, fetch(url));
    return await response.json();
  };

  const getMapTilesFromHost = async (zipUrl) => {
    const response = await timeoutPromise(60000, fetch(zipUrl));
    return await response.json();
  };

  const getMyMapsBbox = async (mapUrl) => {
    const response = await fetch(mapUrl);
    return handleResponse(response);
  };

  const getMyMicroProjects = () => {
    return requestMicro('GET', MICRO_PATHS.MY_PROJECTS, encoded_login);
  };

  const getMyProjects = () => {
    return request('GET', '/myProjects', encoded_login);
  };

  const getProfile = async (encodedLogin) => {
    // return request('GET', '/profile', encodedLogin);
    const response = await timeoutPromise(10000, fetch(
      `${baseUrl}/profile`,
      {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + encodedLogin + '/',
          'Content-Type': 'application/json',
        },
      },
    ));
    return handleResponse(response);
  };

  const getProfileImage = async (encodedLogin) => {
    let imageBlob = null;
    try {
      let imageResponse = await fetch(baseUrl + '/profileimage', {
        method: 'GET',
        responseType: 'blob',
        headers: {
          Authorization: 'Basic ' + encodedLogin,
        },
      });
      if (imageResponse.status === 200) imageBlob = imageResponse.blob();
      return imageBlob;
    }
    catch (error) {
      console.error(error);
    }
  };

  const getProfileImageURL = () => {
    return baseUrl + '/profileimage';
  };

  const getProject = async (projectId, encodedLogin) => {
    return await request('GET', '/project/' + projectId, encodedLogin);
  };

  const getTilehostUrl = () => {
    if (isSelected) return baseUrl.replace('/db', '/strabotiles');
    return tilehost;
  };

  const getSesarToken = async (orcidToken) => {
    const formData = new FormData();
    formData.append('connection', 'strabospot');
    formData.append('orcid_id_token', orcidToken);
    const res = await fetch(SESAR_API + GET_TOKEN, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      // body: JSON.stringify({connection: 'strabospot', orcid_id_token: orcidToken}),
      body: formData,
    });
    const sesarJson = await res.json();
    if (sesarJson.error) {
      console.error('SESAR Token Error', sesarJson.error);
      throw Error(sesarJson.error);
    }
    else {
      console.log('NEW SESAR TOKEN', sesarJson);
      return sesarJson;
    }
  };

  const getSesarUserCode = async (accessToken) => {
    const userCodeXmlRes = await fetch(SESAR_API + GET_USER_CODE, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return userCodeXmlRes.text();
  };

  const getOrcidToken = async () => {
    try {
      const url = ORCID + AUTH + SCOPE + REDIRECT_URL + encodeURIComponent(encoded_login);
      console.log(url);
      await Linking.openURL(url);
    }
    catch (err) {
      console.log(err);
      alert('Error Getting ORCID Token', `${err.toString()}`);
    }
  };

  const postToSesar = async (xmlData) => {
    try {
      const myHeaders = new Headers();
      myHeaders.append('Authorization', `Bearer ${sesar.sesarToken.access}`);
      myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: xmlData,
      };

      const response = await fetch(SESAR_API + SESAR_PATHS.UPLOAD, requestOptions);
      return response;
    }
    catch (err) {
      console.error(err);
      alert('Error Posting to SESAR', `${err.toString()}`);
    }
  };

  const refreshSesarToken = async (accessToken) => {
    const formData = new FormData();
    formData.append('refresh', accessToken);
    const res = await fetch(SESAR_API + REFRESH_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    return await res.json();
  };

  const updateSampleWithSesar = async (xmlData) => {
    try {
      const myHeaders = new Headers();
      myHeaders.append('Authorization', `Bearer ${sesar.sesarToken.access}`);
      myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: xmlData,
      };

      const response = await fetch(SESAR_API + SESAR_PATHS.UPDATE, requestOptions);
      return response;
    }
    catch (err) {
      console.error(err);
      alert('Error Posting to SESAR', `${err.toString()}`);
    }
  };

  const handleError = async (response) => {
    console.log('RESPONSE', response);
    if (response.status === 401) {
      const msg401 = 'This server could not verify that you are authorized to access the document requested. Either '
        + 'you supplied the wrong credentials (e.g., bad password), or your browser doesn\'t understand how to supply '
        + 'the credentials required.';
      return Promise.reject(msg401);
    }
    else if (response.status === 404) {
      const contentType = response.headers.get('content-type');
      if (contentType.includes('text/html')) {

        // Assume HTML response

        const htmlData = await response.text();
        console.log(htmlData);
        // Parse HTML data and display custom 404 page
        return Promise.reject('The requested URL was not found on this server.');

      }
      else {
        const responseJSON = await response.json();
        const errorMessage = responseJSON.error || responseJSON.Error;
        if (errorMessage) return Promise.reject(errorMessage);
      }

      const responseJSON = await response.json();
      const errorMessage = responseJSON.error || responseJSON.Error;
      if (errorMessage) return Promise.reject(errorMessage);
      // return Promise.reject('The requested URL was not found on this server.');
    }
    else if (response.status === 400) {
      const res = await response.json();
      console.log(res);
      return res;
    }
    else {
      try {
        const errorMessage = JSON.parse(await response.text());
        Sentry.captureMessage(`ERROR in useServerRequests: ${errorMessage.Error}`);
        return Promise.reject(errorMessage?.Error || 'Unknown Error');
      }
      catch (err) {
        console.log(err);
        Sentry.captureMessage(`ERROR in useServerRequests: ${JSON.stringify(response)}`);
        return Promise.reject('Unable to parse response. ' + err);
      }
    }
  };

  const handleResponse = (response) => {
    if (response.ok && response.status === 204) return response.text() || 'no  content';
    else if (response.ok) return response.json();
    else return handleError(response);
  };

  const post = async (urlPart, login, data) => {
    try {
      const response = await fetch(baseUrl + urlPart, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Authorization': 'Basic ' + login,
          'Content-Type': 'application/json',
        },
      });
      return handleResponse(response);
    }
    catch (err) {
      console.error('Error Posting', err);
      alert('Error', `${err.toString()}`);
    }
  };

  const request = async (method, urlPart, login, ...otherParams) => {
    try {
      const response = await timeoutPromise(60000, fetch(baseUrl + urlPart, {
        method: method,
        headers: {
          'Authorization': 'Basic ' + login + '/',
          'Content-Type': 'application/json',
        },
        // body: JSON.stringify({data: data}),
        ...otherParams,
      }));
      return handleResponse(response);
    }
    catch (err) {
      console.error('Error Fetching', err);
      alert('Error', `${err.toString()}`);
      throw Error(err);
    }
  };

  const requestMicro = async (method, path, login, ...otherParams) => {
    try {
      // beforeSend request fetch
      const requestFetch = function () {
        return fetch(domain + path, {
          headers: {
            'Authorization': 'Basic ' + login,
            'Content-Type': 'application/json',
          },
        });
      };

      const response = await timeoutPromise(60000, requestFetch(domain + path, {
        method: method,
        // body: JSON.stringify({data: data}),
        ...otherParams,
      }));
      return handleResponse(response);
    }
    catch (err) {
      console.error('Error Fetching', err);
      alert('Error', `${err.toString()}`);
      throw Error(err);
    }
  };

  // Register user
  const registerUser = async (newAccountInfo) => {
    const newAccount = JSON.stringify({
      first_name: newAccountInfo.firstName.value,
      last_name: newAccountInfo.lastName.value,
      email: newAccountInfo.email.value,
      password: newAccountInfo.password.value,
      confirm_password: newAccountInfo.confirmPassword.value,
    });
    const modifiedBaseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/'));
    const response = await fetch(modifiedBaseUrl + '/userRegister', {
      method: 'POST',
      body: newAccount,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  };

  const testCustomMapUrl = async (mapURL) => {
    try {
      const response = await fetch(mapURL);
      return response.ok;
    }
    catch (e) {
      console.log('ERROR', e);
      return e;
    }
  };

  const testEndpoint = async (customEndpointURL) => {
    try {
      const res = await timeoutPromise(10000, fetch(customEndpointURL));
      console.log('Endpoint Test Response:', res);
      return res.ok;
    }
    catch (err) {
      console.log('Endpoint Error:', err);
      return false;
    }
  };

  const timeoutPromise = async (ms, promise) => {
    const timeoutPromiseException = (err) => {
      const timeoutError = Symbol();
      if (err === timeoutError) throw new Error('Network timeout');
      else throw 'Unable to Reach Server!';
    };

    let timer;
    return Promise.race([
      promise,
      new Promise((_r, rej) => timer = setTimeout(rej, ms))])
      .catch(timeoutPromiseException).finally(() => clearTimeout(timer));
  };

  const updateDataset = (dataset) => {
    return post('/dataset', encoded_login, dataset);
  };

  const updateDatasetSpots = (datasetId, spotCollection) => {
    return post('/datasetspots/' + datasetId, encoded_login, spotCollection);
  };

  const updateProfile = (data) => {
    console.log(data);
    return post('/profile', encoded_login, data);
  };

  const uploadProgress = (event) => {
    const percentage = Math.floor((event.loaded / event.total) * 100);
    console.log('UPLOAD IS ' + percentage + '% DONE!');
    dispatch(updatedProjectTransferProgress(event.loaded / event.total));
  };

  const updateProject = async (project) => {
    return post('/project', encoded_login, project);
  };

  const uploadImage = async (formdata, encodedLogin, isProfileImage) => {
    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', uploadProgress);
      xhr.addEventListener('load', () => {
        console.log('XHR RES', xhr.response);
        if (xhr.status === 404) reject(false);
        else resolve(xhr.response);
      });
      xhr.addEventListener('error', (e) => {
        console.error('REJECTED UPDATE', e);
        reject(false);
      });

      if (isProfileImage) xhr.open('POST', baseUrl + '/profileImage');
      else xhr.open('POST', baseUrl + '/image');
      xhr.setRequestHeader('Content-Type', 'multipart/form-data');
      xhr.setRequestHeader('Authorization', 'Basic ' + encoded_login);
      xhr.send(formdata);
    });
  };

  const uploadWebImage = async (formData, encodedLogin) => {
    const response = await fetch(`${baseUrl}/image`, {
      method: 'POST',
      headers: {
        // 'Content-Type': 'multipart/form-data',
        'Authorization': 'Basic ' + encoded_login,
      },
      body: formData,
    });

    console.log(response);
    return handleResponse(response);
  };

  const verifyEndpoint = async (customEndpointURL) => {
    return await testEndpoint(customEndpointURL);
  };

  //TODO: Seems to be not being used
  const verifyImageExistence = (imageId, encodedLogin) => {
    return request('GET', '/verifyimage/' + imageId, encodedLogin);
  };

  const verifyImagesExistence = async (imageIdsArray) => {
    // return request('POST', '/verifyImages/', encoded_login, imageIdArray);
    const response = await timeoutPromise(60000, fetch(baseUrl + '/verifyImages/', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + encoded_login + '/',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageIdsArray),
    }));
    return handleResponse(response);
  };

  const zipURLStatus = async (zipId) => {
    try {
      const myMapsEndpoint = isSelected ? endpoint.replace('/db', '/strabotiles') : tilehost;
      const response = await timeoutPromise(60000, fetch(myMapsEndpoint + '/asyncstatus/' + zipId));
      const responseJson = await response.json();
      console.log(responseJson);
      if (responseJson.error) throw Error(responseJson.error);
      return responseJson;
    }
    catch (err) {
      console.error('There was an error in zipURLStatus', err);
      throw new Error(err);
    }
  };

  return {
    addDatasetToProject: addDatasetToProject,
    authenticateUser: authenticateUser,
    deleteAllSpotsInDataset: deleteAllSpotsInDataset,
    deleteProfile: deleteProfile,
    deleteProfileImage: deleteProfileImage,
    // deleteProject: deleteProject,
    downloadImage: downloadImage,
    getDataset: getDataset,
    getDatasetSpots: getDatasetSpots, //TODO: Find out why the encoded login is being passed so deeply
    getDatasets: getDatasets, //TODO: Is encoded login being passed because of web autolog? Is there a better way to pass this?
    getDbUrl: getDbUrl,
    getImage: getImage,
    getImageUrl: getImageUrl,
    getMacrostratData: getMacrostratData,
    getTileCountFromHost: getTileCountFromHost,
    getMapTilesFromHost: getMapTilesFromHost,
    getMyMapsBbox: getMyMapsBbox,
    getMyMicroProjects: getMyMicroProjects,
    getMyProjects: getMyProjects,
    getProfile: getProfile, // TODO: does encoded login need to be passed so deeply
    getProfileImage: getProfileImage, // TODO: does encoded login need to be passed so deeply
    getProfileImageURL: getProfileImageURL, // TODO: does encoded login need to be passed so deeply
    getProject: getProject, // TODO: does encoded login need to be passed so deeply
    getTilehostUrl: getTilehostUrl,
    getSesarToken: getSesarToken,
    getSesarUserCode: getSesarUserCode,
    getOrcidToken: getOrcidToken,
    postToSesar: postToSesar,
    refreshSesarToken: refreshSesarToken,
    updateSampleWithSesar: updateSampleWithSesar,
    registerUser: registerUser,
    testCustomMapUrl: testCustomMapUrl,
    testEndpoint: testEndpoint,
    timeoutPromise: timeoutPromise,
    updateDataset: updateDataset,
    updateDatasetSpots: updateDatasetSpots,
    updateProfile: updateProfile,
    updateProject: updateProject,
    uploadImage: uploadImage,
    uploadWebImage: uploadWebImage,
    verifyEndpoint: verifyEndpoint,
    verifyImageExistence: verifyImageExistence,
    verifyImagesExistence: verifyImagesExistence,
    zipURLStatus: zipURLStatus,
  };
};

export default useServerRequests;


