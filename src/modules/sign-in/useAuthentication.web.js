import {useEffect} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import useServerRequests from '../../services/network/useServerRequests';
import {login, logout} from '../user/userProfile.slice';

const useAuthentication = () => {
  const dispatch = useDispatch();
  const encodedLogin = useSelector(state => state.user.encoded_login);
  const isAuthenticated = useSelector(state => state.user.isAuthenticated);
  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);

  const {authenticateUser} = useServerRequests();

  let timeout;

  useEffect(() => {
    console.log('Checking authentication...');
    checkAuthentication();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isAuthenticated, isOnline]);

  const checkAuthentication = async () => {
    if (encodedLogin) {
      const credentials = atob(encodedLogin);
      const email = credentials.split(':')[0];
      const password = credentials.split(':')[1];
      try {
        await doAuthenticateUser(email, password);
        console.log('Passed Authentication Check');
      }
      catch (err) {
        // doAuthenticateUser has already logged the failure and dispatched logout. Swallow it here so the timer
        // below still restarts - otherwise one failed check ends the re-authentication loop for good.
        console.error('Authentication check failed.', err);
      }
    }
    checkAuthenticationRestartTimer();
  };

  const checkAuthenticationRestartTimer = () => {
    console.log('Restarting Authentication Check Timer...');

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      checkAuthentication();
    }, 1000 * 60 * 5);  // 5 minutes
  };

  const doAuthenticateUser = async (email, password) => {
    try {
      console.log('Authenticating user...');
      const userAuthResponse = await authenticateUser(email, password);
      if (userAuthResponse?.valid === 'true') {
        if (!isAuthenticated) dispatch(login());
        console.log('User Authenticated.');
      }
      else throw Error('Incorrect username and/or password');
    }
    catch (err) {
      console.error('Authentication Error. Logging Out\n', err);
      dispatch(logout());
      throw err;
    }
  };
};

export default useAuthentication;
