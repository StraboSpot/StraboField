import {Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';
import {Base64} from 'js-base64';
import {useDispatch, useSelector} from 'react-redux';

import useDownload from '../../services/useDownload';
import useResetState from '../../services/useResetState';
import {isEmpty} from '../../shared/Helpers';
import {setIsProjectLoadSelectionModalVisible, setLoadingStatus} from '../home/home.slice';
import {login, logout} from '../user/userProfile.slice';

const useSignIn = () => {
  const dispatch = useDispatch();
  const currentProjectId = useSelector(state => state.project.project?.id);
  const userEmail = useSelector(state => state.user.email);

  const {clearUser} = useResetState();
  const {downloadUserProfile} = useDownload();

  const guestSignIn = async () => {
    Sentry.setUser({'id': 'GUEST'});
    if (!isEmpty(userEmail)) clearUser();
    console.log('Loading user: GUEST');
    setTimeout(() => isEmpty(currentProjectId) && dispatch(setIsProjectLoadSelectionModalVisible(true)), 500);
  };

  const signIn = async (email, password, setUsername, setPassword, setErrorMessage, setIsErrorModalVisible) => {
    console.log(`Authenticating ${email} and getting user profile...`);
    try {
      const newEncodedLogin = Base64.encode(email + ':' + password);
      await downloadUserProfile(newEncodedLogin);

      console.log(`${email} is successfully logged in!`);
      dispatch(login());

      if (Platform.OS !== 'web') {
        isEmpty(currentProjectId) && dispatch(setIsProjectLoadSelectionModalVisible(true));
        dispatch(setLoadingStatus({view: 'home', bool: false}));
        if (setUsername) setUsername('');
        if (setPassword) setPassword('');
      }
    }
    catch (err) {
      console.error('Log In Error:', err);
      Sentry.captureException(err);
      if (Platform.OS !== 'web') {
        dispatch(setLoadingStatus({view: 'home', bool: false}));
        const errMsg = err.message || 'Credentials entered are incorrect. Please try again.';
        if (setErrorMessage) setErrorMessage(errMsg);
        if (setIsErrorModalVisible) setIsErrorModalVisible(true);
        if (setPassword) setPassword('');
      }
      dispatch(logout());
      throw Error;
    }
  };

  return {
    guestSignIn: guestSignIn,
    signIn: signIn,
  };
};

export default useSignIn;
