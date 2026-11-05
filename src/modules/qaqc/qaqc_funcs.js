import {getRequest} from '../../services/network/serverRequests.helpers';
import {QAQC_PATHS} from '../../services/network/urls.constants';

const basicAuth = token => ({type: 'basic', token});

export const runQAQC = async (dataset, projectId, encodedLogin, toast, toastId) => {
  console.log('runQAQC()');
  if (!dataset?.id) throw new Error('Dataset ID is missing');
  if (!encodedLogin) throw new Error('User credentials are missing');

  toast.update(toastId, `Started QAQC process for ${dataset.name}, please wait until download...`,
    {type: 'normal', animationType: 'slide-in', duration: 120000, placement: 'top'});

  // Python script parameters
  const params = new URLSearchParams({
    'action': 'completeness',
    'plainreq': 'true',
    'doAnnotate': 'true',
    'pid': projectId,
    'dsid': dataset.id,
  });

  const response = await getRequest(`${QAQC_PATHS.URL}/api.php?${params.toString()}`, basicAuth(encodedLogin),
    {responseType: 'document'});

  // Block until response
  await response.text();
  if (!response.ok) throw new Error(`HTTP error. status: ${response.status}`);

  // Count down to the download that follows in RunQAQC, which brings the QAQC notes onto the device so the local
  // datasets don't fall out of step with the server's
  for (let iter = 3; iter > 0; iter--) {
    toast.update(toastId, `Downloading QAQC notes in ${iter} seconds.`, {type: 'warning'});
    await new Promise(r => setTimeout(r, 1000));
  }
  toast.hide(toastId);
};
