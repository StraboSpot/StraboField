import {Base64} from 'js-base64';
import {useDispatch} from 'react-redux';

import useSignIn from './useSignIn';
import useDownload from '../../services/files/useDownload';
import {setLoadingStatus} from '../home/home.slice';

const CREDENTIALS_STORAGE_KEY = 'strabofield-web-credentials';

const useAutoLogIn = () => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {initializeDownload} = useDownload();
  const {signIn} = useSignIn();

  /* Internal Functions */

  // The temporary login strabospot.org passes in the URL grants the whole account until it expires, so it is moved out
  // of the address bar, where a copied link would carry it, into this tab's sessionStorage, where a reload finds it.
  const takeCredentials = (url) => {
    const credentialsInUrl = url.match(/[?&]credentials=([^&#]+)/)?.[1];
    if (!credentialsInUrl) return window.sessionStorage.getItem(CREDENTIALS_STORAGE_KEY);
    try {
      window.sessionStorage.setItem(CREDENTIALS_STORAGE_KEY, credentialsInUrl);
      // Edited as text: the link puts its parameters after the "#" route, out of reach of URL.searchParams
      const urlWithoutCredentials = url.replace(/([?&])credentials=[^&#]*(&?)/,
        (match, separator, nextSeparator) => nextSeparator ? separator : '');
      window.history.replaceState(window.history.state, '', urlWithoutCredentials);
    }
    catch (err) {
      console.warn('Could not move the credentials out of the address bar. Leaving them there.', err);
    }
    return credentialsInUrl;
  };

  const loadProjectWeb = async (projectId, newEncodedLogin) => {
    try {
      await initializeDownload({id: projectId}, newEncodedLogin);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
    catch (err) {
      console.error('Error loading project', err);
      // No modal here: rethrowing sends Routes.web to AuthenticationErrorSplashScreen, which replaces the whole
      // tree, so anything opened now would flash for a frame and vanish. That splash is the report the user sees.
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      throw err;
    }
  };

  /* Exported Functions */

  const autoLogIn = async () => {
    console.log('Performing Auto Login...');

    // Read off the raw URL: URLSearchParams would turn a "+" in the Base64 credentials into a space
    const url = new URL(window.location).href;
    const credentialsEncoded = takeCredentials(url);
    const projectIdRegEx = new RegExp('[?&]' + 'projectid' + '=([^&]+).*$');
    const projectId = url.match(projectIdRegEx)?.[1];
    if (!credentialsEncoded) throw Error('Credentials not found.');

    const credentials = Base64.decode(credentialsEncoded);
    const email = credentials.split('*****')[0];
    const password = credentials.split('*****')[1];
    console.log('Got Project Id:', projectId);
    await signIn(email, password);
    const newEncodedLogin = Base64.encode(email + ':' + password);
    await loadProjectWeb(projectId, newEncodedLogin);
  };

  return {
    autoLogIn,
  };
};

export default useAutoLogIn;
