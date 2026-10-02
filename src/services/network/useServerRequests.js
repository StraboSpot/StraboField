import {Linking, Platform} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {
  deleteRequest,
  getRequest,
  patchRequest,
  postFormDataRequest,
  postRequest,
  timeoutPromise,
} from './serverRequests.helpers';
import {MACROSTRAT_PATHS, MICRO_PATHS, ORCID_PATHS, SAMPLES_PATHS, SESAR_PATHS, STRABO_APIS} from './urls.constants';
import {userAgent} from './userAgent.constants';
import {updatedProjectTransferProgress} from '../../modules/connections/connections.slice';
import {MISSING_STRABO_USER_ID_MESSAGE} from '../../modules/samples/samples.constants';
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

  const bearerAuth = token => ({type: 'bearer', token});

  const getImageBaseUrl = () => isSelected ? baseUrl.replace('/db', '/pi/') : `${STRABO_APIS.STRABO}/pi/`;

  // SESAR error bodies come in several shapes: legacy {error} or {detail, code}, and the new {message, errors} where
  // `errors` maps a field to a message or an array of messages. Collapse whichever is present into one string.
  const getSesarErrorMessage = (json) => {
    const fieldErrors = Object.values(json?.errors || {}).flat().filter(e => typeof e === 'string');
    const message = json?.error || json?.message || json?.detail;
    // `message` usually repeats one of the field errors, so drop duplicates before joining.
    return [...new Set([message, ...fieldErrors].filter(Boolean))].join('\n') || undefined;
  };

  // Registers (POST /samples/) or updates (PATCH /samples/{igsn}/) a sample through the SESAR v2 JSON API and
  // returns the sample SESAR sends back. Throws a user-facing message on any failure so registerSample shows it.
  const sendToSesar = async (method, path, payload) => {
    let response;
    try {
      // Read the access token from the store rather than the useSelector closure: registerSample may refresh and
      // dispatch a new token immediately before posting, and the closure captured at render time would still hold
      // the stale (expired) one until the next re-render.
      const accessToken = store.getState().user.sesar.sesarToken.access;
      const request = method === 'PATCH' ? patchRequest : postRequest;
      response = await request(`${SESAR_PATHS.SESAR_API}${path}`, JSON.stringify(payload), bearerAuth(accessToken),
        {'Accept': 'application/json', 'Content-Type': 'application/json'});
    }
    catch (err) {
      // Re-throw a clean, user-facing message so the caller (registerSample) surfaces it on the error view.
      // Previously this swallowed the error and returned undefined, causing a downstream `undefined.text()` crash.
      console.error('Error Posting to SESAR', err);
      throw new Error(err?.message === 'Network timeout'
        ? 'SESAR did not respond (network timeout). Please check your connection and try again.'
        : 'Unable to reach SESAR. Please check your Internet connection and try again.');
    }
    const json = await response.json().catch(() => undefined);
    console.log('SESAR Sample Response', response.status, json);
    // Validation failures come back as 400 {message, errors: {field: [messages]}}.
    if (!response.ok) {
      throw Error(
        getSesarErrorMessage(json) || `SESAR rejected the sample (status ${response.status}).`);
    }
    const sample = json?.data ?? json;
    if (!sample?.igsn) throw Error('SESAR returned an unreadable response. Please try again.');
    return sample;
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

  // Without the owner's userpkey, a sample shared by a collaborator is a 404. With no owner given, it's the user's own,
  // read from the store since a profile just loaded by a sign-in isn't in this render yet.
  const getStraboSample = async (id, ownerId, encodedLogin) => {
    const owner = ownerId || store.getState().user.straboUserId;
    if (!owner) throw Error(MISSING_STRABO_USER_ID_MESSAGE);
    return getRequest(`${getSamplesBaseUrl()}${SAMPLES_PATHS.SAMPLE}${encodeURIComponent(id)}?owner=${encodeURIComponent(owner)}`,
      basicAuth(encodedLogin));
  };

  const getSesarToken = async (orcidToken) => {
    // Exchanges the ORCID id token for a SESAR access/refresh pair tied to the StraboSpot connection. The token must
    // go as form data: this endpoint ignores a JSON body and answers as if no token was sent ("The given ORCID JWT is
    // either invalid..."). Content-Type is left unset so fetch adds the multipart boundary.
    const formData = new FormData();
    formData.append('token', orcidToken);
    const response = await postRequest(`${SESAR_PATHS.SESAR_API}${SESAR_PATHS.GET_TOKEN}`, formData, null,
      {'Accept': 'application/json'});
    const json = await response.json();
    // SESAR v2 wraps the token pair in `data` ({data: {access, refresh}}); fall back to a top-level pair.
    const tokens = json.data ?? json;
    // A new-shape {message, errors} body only counts as a failure when no token came back, since a success may also
    // carry a `message`.
    if (json.error || !response.ok || (json.message && !tokens?.access)) {
      const errorMessage = getSesarErrorMessage(json) || `SESAR token request failed (status ${response.status}).`;
      console.error('SESAR Token Error', errorMessage);
      throw Error(errorMessage);
    }
    return tokens;
  };

  // SESAR retired the XML credentials_service_v2.php (it now rewrites to /api/auth/user/, which has no codes); the
  // v2 API lists the codes the user can register samples under as a JSON array of {sesar_code, team, ...}.
  // Returns null when SESAR rejects the access token (401) so the caller can refresh and retry.
  const getSesarUserCodes = async (accessToken) => {
    const response = await getRequest(`${SESAR_PATHS.SESAR_API}${SESAR_PATHS.GET_USER_CODES}`,
      bearerAuth(accessToken), {responseType: 'json'});
    if (response.status === 401) return null;
    const json = await response.json().catch(() => undefined);
    const codes = json?.data ?? json;
    if (!response.ok || !Array.isArray(codes)) {
      throw Error(getSesarErrorMessage(json) || `Unable to load SESAR user codes (status ${response.status}).`);
    }
    return codes;
  };

  const getTileBaseUrl = () => isSelected ? endpoint.replace('/db', '/strabotiles') : tilehost;

  const getTilesFromHost = async (url) => {
    const response = await timeoutPromise(fetch(url));
    return response.json();
  };

  const postToSesar = payload => sendToSesar('POST', SESAR_PATHS.SAMPLES, payload);

  const refreshSesarToken = async (refreshTokenValue) => {
    const response = await postRequest(`${SESAR_PATHS.SESAR_API}${SESAR_PATHS.REFRESH_TOKEN}`,
      JSON.stringify({refresh: refreshTokenValue}), null,
      {'Accept': 'application/json', 'Content-Type': 'application/json'});
    const json = await response.json();
    // SESAR returns 401 ({message, errors}, or legacy {detail, code}) when the refresh token is invalid or expired. Map
    // it to an `error` shape so the caller doesn't mistake the failure body for a valid {access, refresh} pair —
    // destructuring that blindly wipes both stored tokens and locks the user out silently.
    if (!response.ok) {
      return {code: json.code, error: getSesarErrorMessage(json) || 'SESAR refresh token is invalid or expired'};
    }
    // SESAR v2 wraps the token pair in `data` ({data: {access, refresh}}); fall back to a top-level pair.
    return json.data ?? json;
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

  const updateOnSesar = (igsn, payload) =>
    sendToSesar('PATCH', `${SESAR_PATHS.SAMPLES}${encodeURIComponent(igsn)}/`, payload);

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
    getMySamples,
    getOrcidToken,
    getProfile,
    getProfileImage,
    getProfileImageURL,
    getProject,
    getSesarToken,
    getStraboSample,
    getSesarUserCodes,
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
    updateOnSesar,
    updateProfile,
    updateProject,
    uploadImage,
    uploadWebImage,
    verifyImagesExistence,
    zipURLStatus,
  };
};

export default useServerRequests;
