import {getRequest} from '../../services/network/serverRequests.helpers';
import {QAQC_PATHS} from '../../services/network/urls.constants';

const basicAuth = token => ({type: 'basic', token});

export const startQAQC = async (dataset, projectID, encodedLogin, toast, toast_id) => {
  // Check for dataset id and encoded login
  console.log('startQAQC()');
  if (!dataset.id) {
    console.error('Dataset ID is missing');
    throw new Error('Project ID is missing');
  }

  if (!encodedLogin) {
    console.error('User credentials are missing');
    throw new Error('User credentials are missing');
  }

  // Update toast to show dataset name
  toast.update(toast_id,
    `Started QAQC process for ${dataset.name}, please wait until download...`,
    {
      type: 'normal',
      animationType: 'slide-in',
      duration: 120000,
      placement: 'top',
    });

  try {
    // Python script parameters
    const params = new URLSearchParams({
      'action': 'completeness',
      'plainreq': 'true',
      'doAnnotate': 'true',
      'pid': projectID,
      'dsid': dataset.id,
    });

    // Send the request
    const response = await getRequest(`${QAQC_PATHS.URL}/api.php?${params.toString()}`, basicAuth(encodedLogin),
      {responseType: 'document'});

    // Block until response
    await response.text();
    if (!response.ok) {
      toast.hide(toast_id);
      throw new Error(`HTTP error. status: ${response.status}`);
    }

    // I think we want to force the user to download QAQC notes to avoid desync with local datasets
    // This just stalls for 3 seconds, the initializeDownload call is in DatasetDetails
    for (let iter = 3; iter > 0; iter--) {
      toast.update(toast_id,
        `Downloading QAQC notes in ${iter} seconds.`,
        {type: 'warning'},
      );
      await new Promise(r => setTimeout(r, 1000));
    }

    toast.hide(toast_id);
    return response;
  }
  catch (err) {
    throw (err);
  }
};

export const runQAQC = async (dataset, currentProjectId, encodedLogin, toast, toast_id) => {
  console.log('runQAQC()');
  if (dataset && dataset.id) {
    try {
      return await startQAQC(dataset, currentProjectId, encodedLogin, toast, toast_id);
    }
    catch (err) {
      throw (err);
    }
  }
  else console.error('Target dataset or id is undefined!');
};
