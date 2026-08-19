import {Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';
import {Base64} from 'js-base64';
import {useDispatch, useSelector} from 'react-redux';

import useDownload from '../../services/files/useDownload';
import {isEmpty} from '../../shared/helpers';
import useResetState from '../../store/useResetState';
import {openedMessageModal, setIsProjectLoadSelectionModalVisible, setLoadingStatus} from '../home/home.slice';
import {login, logout} from '../user/userProfile.slice';

const useSignIn = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentProjectId = useSelector(state => state.project.project?.id);
  const userEmail = useSelector(state => state.user.email);

  const {downloadUserProfile} = useDownload();
  const {clearUser} = useResetState();

  /* Exported Functions */

  const guestSignIn = async () => {
    Sentry.setUser({'id': 'GUEST'});
    if (!isEmpty(userEmail)) clearUser();
    console.log('Loading user: GUEST');
    dispatch(login());
    setTimeout(() => isEmpty(currentProjectId) && dispatch(setIsProjectLoadSelectionModalVisible(true)), 500);
  };

  const signIn = async (email, password, setUsername, setPassword) => {
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
        dispatch(openedMessageModal({message: errMsg, title: 'Error Signing In!'}));
        if (setPassword) setPassword('');
      }
      dispatch(logout());
      throw Error;
    }
  };

  return {
    guestSignIn,
    signIn,
  };
};

export default useSignIn;
