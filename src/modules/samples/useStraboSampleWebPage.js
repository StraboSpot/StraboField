import {useSelector} from 'react-redux';

import {getStraboSampleFromResponse, isLinkedToFieldSpot} from './samples.helpers';
import {SAMPLES_PATHS} from '../../services/network/urls.constants';
import useServerRequests from '../../services/network/useServerRequests';
import {isEmpty, openUrl} from '../../shared/helpers';
import alert from '../../shared/ui/alert';

// A linked sample's page on the StraboSamples website, which can only be opened online
const useStraboSampleWebPage = () => {
  /* Data Hooks */

  const isInternetReachable = useSelector(state => state.connections.isOnline.isInternetReachable);
  const straboUserId = useSelector(state => state.user.straboUserId);

  const {getStraboSample} = useServerRequests();

  /* Exported Functions */

  // The page's url, or undefined while offline or before the user's profile has loaded
  const getStraboSampleUrl = strabosamplesId => !isEmpty(strabosamplesId) && isInternetReachable
  && !isEmpty(straboUserId)
    ? `${SAMPLES_PATHS.WEB_SAMPLE}${encodeURIComponent(straboUserId)}/${encodeURIComponent(strabosamplesId)}`
    : undefined;

  // Whether the server has the link yet, which it only does once the Spot holding the sample has been uploaded. The
  // server knows the link by that Spot: a rich sample's own, or the parent of a sample kept on it.
  const getIsLinkUploaded = async (strabosamplesId, spotId) => {
    const strabosample = getStraboSampleFromResponse(await getStraboSample(strabosamplesId)) ?? {};
    return isLinkedToFieldSpot(strabosample, spotId);
  };

  // Open the page, after asking the server whether it knows the link yet rather than land on a page that doesn't
  // show it
  const openStraboSampleWebPage = async (strabosamplesId, spotId) => {
    const sampleUrl = getStraboSampleUrl(strabosamplesId);
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
