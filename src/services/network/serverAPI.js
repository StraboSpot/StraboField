import * as Sentry from '@sentry/react-native';

import {STRABO_APIS} from './urls.constants';
import {setIsSessionExpiredModalVisible} from '../../modules/home/home.slice';
import alert from '../../shared/ui/alert';
import {store} from '../../store/ConfigureStore';

const baseUrl = STRABO_APIS.DB;

/* Internal Functions */

const handleError = async (response, login) => {
  console.log('RESPONSE', response);
  if (response.status === 401) {
    // A 401 means the stored Basic-Auth credentials are no longer valid (e.g. the user changed their
    // password on the website). Show the re-auth modal over the current screen instead of logging out —
    // that keeps the user on their map with their unsynced data intact rather than jarringly navigating
    // them back to the sign-in screen. Only trigger when the failing request actually carried the
    // credentials we still have stored: that excludes the sign-in endpoint (a bad-password 401) and
    // stragglers left in flight with an old token when the user has already re-authenticated (their token
    // no longer matches the freshly-stored one), so re-authenticating stays final and the modal does not
    // pop back up.
    const {encoded_login: currentLogin, isAuthenticated} = store.getState().user;
    const usedCurrentCreds = Boolean(currentLogin) && login === currentLogin;
    if (isAuthenticated && usedCurrentCreds && !response.url?.includes('userAuthenticate')) {
      store.dispatch(setIsSessionExpiredModalVisible(true));
    }
    const msg401 = 'This server could not verify that you are authorized to access the document requested. Either '
      + 'you supplied the wrong credentials (e.g., bad password), or your browser doesn\'t understand how to supply '
      + 'the credentials required.';
    return Promise.reject(msg401);
  }
  else if (response.status === 404) {
    const responseJSON = await response.json();
    const errorMessage = responseJSON.error || responseJSON.Error;
    if (errorMessage) return Promise.reject(errorMessage);
    return Promise.reject('The requested URL was not found on this server.');
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

const handleResponse = (response, login) => {
  if (response.ok && response.status === 204) return response.text() || 'no  content';
  // else if (response.ok) return response.json();
  else if (response.ok) return response;
  else return handleError(response, login);
};

const post = async (urlPart, login, data) => {
  try {
    const response = await fetch(baseUrl + urlPart, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {'Authorization': 'Basic ' + login, 'Content-Type': 'application/json'},
    });
    return handleResponse(response, login);
  }
  catch (err) {
    console.error('Error Posting', err);
    alert('Error', `${err.toString()}`);
  }
};

/* Exported Functions */

// Delete dataset
export const deleteDataset = async (datasetId, encodedLogin) => {
  try {
    const response = await fetch(
      baseUrl + '/dataset/' + datasetId,
      {
        method: 'DELETE',
        headers: {'Authorization': 'Basic ' + encodedLogin, 'Content-Type': 'application/json'},
      },
    );
    return handleResponse(response, encodedLogin);
  }
  catch (err) {
    console.error('Error deleting dataset', err);
  }
};

// Move one Spot from a one Dataset to Another
export const moveSpotToDataset = async (spotId, datasetId, modifiedTimestamp, encodedLogin) => {
  return post('/moveSpotToDataset', encodedLogin, {
    'spot_id': spotId,
    'dataset_id': datasetId,
    'modified_timestamp': modifiedTimestamp,
  });
};

// Update project
export const updateProject = (project, encodedLogin) => {
  return post('/project/' + project.id, encodedLogin, project);
};

// Upload project/datasets/spotId of deleted Spot for live DB connection
export const uploadProjectDatasetDeleteSpot = (projectDatasetsSpotId, encodedLogin) => {
  return post('/projectdatasetdeletespot', encodedLogin, projectDatasetsSpotId);
};

// Upload project/datasets/spots for live DB connection
export const uploadProjectDatasetsSpots = (projectDatasetsSpots, encodedLogin) => {
  return post('/projectdatasetsspots', encodedLogin, projectDatasetsSpots);
};
