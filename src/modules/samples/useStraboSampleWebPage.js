import {useEffect} from 'react';

import {useSelector} from 'react-redux';

import {getStraboSampleFromResponse, isLinkedToFieldSpot} from './samples.helpers';
import {SAMPLES_PATHS} from '../../services/network/urls.constants';
import useServerRequests from '../../services/network/useServerRequests';
import {isEmpty, openUrl} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {getDatasetOwnerId} from '../project/projects.helpers';
import useProject from '../project/useProject';
import useUserProfile from '../user/useUserProfile';

// A linked sample's page on the StraboSamples website, which can only be opened online
const useStraboSampleWebPage = () => {
  /* Data Hooks */

  const datasets = useSelector(state => state.project.datasets) || {};
  const isInternetReachable = useSelector(state => state.connections.isOnline.isInternetReachable);
  const projectOwnerId = useSelector(state => state.project.project?.owner_straboUserId);
  const straboUserId = useSelector(state => state.user.straboUserId);

  const {getDatasetIdFromSpotId} = useProject();
  const {getStraboSample} = useServerRequests();
  const {getStraboUserId} = useUserProfile();

  /* Side Effects */

  // The page's url needs the owner's id, which is the user's own when nothing older says otherwise
  useEffect(() => {
    if (isEmpty(straboUserId) && isInternetReachable) getStraboUserId();
  }, [straboUserId, isInternetReachable]);

  /* Logic Helpers */

  // StraboSamples knows a sample by its id and its owner's id. Only the user's own samples can be linked, and only in
  // their own dataset, so the owner is whoever owns the dataset holding the Spot - in a shared project, maybe not the
  // user. A dataset saved before the server sent its owner falls back to the project's, then to the user.
  const getSampleOwnerId = (spotId) => {
    const ownerId = getDatasetOwnerId(datasets[getDatasetIdFromSpotId(spotId)], projectOwnerId);
    return isEmpty(ownerId) ? straboUserId : ownerId;
  };

  /* Exported Functions */

  // The page's url, or undefined while offline or before the owner is known. The server knows the link by the Spot
  // holding the sample: a rich sample's own, or the parent of a sample kept on it.
  const getStraboSampleUrl = (strabosamplesId, spotId) => {
    const ownerId = getSampleOwnerId(spotId);
    return !isEmpty(strabosamplesId) && isInternetReachable && !isEmpty(ownerId)
      ? `${SAMPLES_PATHS.WEB_SAMPLE}${encodeURIComponent(ownerId)}/${encodeURIComponent(strabosamplesId)}`
      : undefined;
  };

  // Whether the server has the link yet, which it only does once the Spot holding the sample has been uploaded. Another
  // user's sample came down from the server already linked, and the samples API won't show it to a collaborator even
  // where the web page will, so it isn't asked.
  const getIsLinkUploaded = async (strabosamplesId, spotId) => {
    const ownerId = getSampleOwnerId(spotId);
    if (String(ownerId) !== String(straboUserId)) return true;
    const strabosample = getStraboSampleFromResponse(await getStraboSample(strabosamplesId, ownerId)) ?? {};
    return isLinkedToFieldSpot(strabosample, spotId);
  };

  // Open the page, after asking the server whether it knows the link yet rather than land on a page that doesn't
  // show it
  const openStraboSampleWebPage = async (strabosamplesId, spotId) => {
    const sampleUrl = getStraboSampleUrl(strabosamplesId, spotId);
    if (!sampleUrl) return;
    try {
      if (!await getIsLinkUploaded(strabosamplesId, spotId)) {
        alert('Link Not Uploaded', 'This sample\'s link to StraboSamples hasn\'t been uploaded yet. Upload the'
          + ' project, then try again.');
        return;
      }
    }
    catch (err) {
      console.error('Error checking the sample on StraboSamples', err);
      alert('Uh Oh!', 'Could not check this sample on StraboSamples. Please try again.');
      return;
    }
    try {
      await openUrl(sampleUrl);
    }
    catch (err) {
      console.error('Can\'t open URL', err);
      alert('Uh Oh!', `Can not open the url ${sampleUrl}`);
    }
  };

  return {
    getIsLinkUploaded: getIsLinkUploaded,
    getStraboSampleUrl: getStraboSampleUrl,
    openStraboSampleWebPage: openStraboSampleWebPage,
  };
};

export default useStraboSampleWebPage;
