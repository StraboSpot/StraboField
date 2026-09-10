// The same server calls as useServerRequests, for callers that cannot use a hook. Web-only by architecture rather
// than by accident: a web edit goes straight to the server from listenerMiddleware.web.js, while native treats the
// local copy as authoritative and uploads later from hooks. Requests go through the shared helpers so response and
// error handling stay in one place.

import {deleteRequest, postRequest} from './serverRequests.helpers';
import {STRABO_APIS} from './urls.constants';

const baseUrl = STRABO_APIS.DB;

// A project save carries every dataset and spot, so it can outrun the helpers' one-minute default on a slow
// connection. Matches the timeout updateDatasetSpots uses for the same reason.
const UPLOAD_TIMEOUT = 300000;

/* Internal Functions */

const basicAuth = token => ({type: 'basic', token});

/* Exported Functions */

export const deleteDataset = (datasetId, encodedLogin) =>
  deleteRequest(`${baseUrl}/dataset/${datasetId}`, basicAuth(encodedLogin));

export const moveSpotToDataset = (spotId, datasetId, modifiedTimestamp, encodedLogin) =>
  postRequest(`${baseUrl}/moveSpotToDataset`, {
    spot_id: spotId,
    dataset_id: datasetId,
    modified_timestamp: modifiedTimestamp,
  }, basicAuth(encodedLogin));

export const updateProject = (project, encodedLogin) =>
  postRequest(`${baseUrl}/project/${project.id}`, project, basicAuth(encodedLogin));

export const uploadProjectDatasetDeleteSpot = (projectDatasetsSpotId, encodedLogin) =>
  postRequest(`${baseUrl}/projectdatasetdeletespot`, projectDatasetsSpotId, basicAuth(encodedLogin));

export const uploadProjectDatasetsSpots = (projectDatasetsSpots, encodedLogin) =>
  postRequest(`${baseUrl}/projectdatasetsspots`, projectDatasetsSpots, basicAuth(encodedLogin), {}, UPLOAD_TIMEOUT);
