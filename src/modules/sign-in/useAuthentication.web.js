import {useEffect} from 'react';

import {Base64} from 'js-base64';
import {useDispatch, useSelector} from 'react-redux';

import {isAuthenticationError} from '../../services/network/serverRequests.helpers';
import useServerRequests from '../../services/network/useServerRequests';
import {logout} from '../user/userProfile.slice';

const CHECK_INTERVAL = 1000 * 60 * 5;  // 5 minutes

// Re-checks the temporary login strabospot.org passes in the URL, which the server expires 24 hours after issuing it.
// Only an explicit refusal logs out: logging out unmounts the app, so a failed request leaves the session alone.
const useAuthentication = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const encodedLogin = useSelector(state => state.user.encoded_login);
  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);

  const {authenticateUser} = useServerRequests();

  /* Side Effects */

  useEffect(() => {
    if (!encodedLogin || isOnline === false) return;
    let isCanceled = false;  // An answer for a login since replaced would log out the one now in use
    const checkCurrentLogin = async () => {
      const isRefused = await isLoginRefused();
      if (isRefused && !isCanceled) {
        console.error('Authentication refused. Logging out.');
        dispatch(logout());
      }
    };
    checkCurrentLogin();
    const interval = setInterval(checkCurrentLogin, CHECK_INTERVAL);
    // Browsers throttle or freeze a background tab's timers, so also check as soon as the user is back
    const checkWhenVisible = () => {
      if (document.visibilityState === 'visible') checkCurrentLogin();
    };
    document.addEventListener('visibilitychange', checkWhenVisible);
    return () => {
      isCanceled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', checkWhenVisible);
    };
  }, [encodedLogin, isOnline]);

  /* Internal Functions */

  // A reply without a verdict (a 400's error body) or no reply at all is not a refusal
  const isLoginRefused = async () => {
    const credentials = Base64.decode(encodedLogin);
    const separatorIndex = credentials.indexOf(':');  // Only the first colon: a password may contain one
    const email = credentials.slice(0, separatorIndex);
    const password = credentials.slice(separatorIndex + 1);
    try {
      const userAuthResponse = await authenticateUser(email, password);
      return userAuthResponse?.valid !== undefined && userAuthResponse.valid !== 'true';
    }
    catch (err) {
      return isAuthenticationError(err);
    }
  };
};

export default useAuthentication;
