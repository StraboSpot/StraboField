import {useRef} from 'react';

import {Base64} from 'js-base64';
import {useDispatch} from 'react-redux';

import useSignIn from './useSignIn';
import useDownload from '../../services/useDownload';
import {
  addedStatusMessage,
  clearedStatusMessages,
  setIsErrorMessagesModalVisible,
  setLoadingStatus,
} from '../home/home.slice';
import {setSelectedProject} from '../project/projects.slice';

const useAutoLogIn = () => {
  const dispatch = useDispatch();

  const {signIn} = useSignIn();
  const {initializeDownload} = useDownload();

  const project = useRef(null);

  /* Internal Functions */

  const loadProjectWeb = async (projectId, newEncodedLogin) => {
    try {
      await initializeDownload({id: projectId}, newEncodedLogin);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
    catch (err) {
      console.error('Error loading project', err);
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Error loading project!'));
      dispatch(setIsErrorMessagesModalVisible(true));
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      throw Error;
    }
  };

  /* Exported Functions */

  const autoLogIn = async () => {
    console.log('Performing Auto Login...');

    const url = new URL(window.location).href;
    const credentialsRegEx = new RegExp('[?&]' + 'credentials' + '=([^&]+).*$');
    const credentialsEncoded = url.match(credentialsRegEx)?.[1];
    const projectIdRegEx = new RegExp('[?&]' + 'projectid' + '=([^&]+).*$');
    const projectId = url.match(projectIdRegEx)?.[1];
    project.current = {id: projectId};

    if (credentialsEncoded) {
      try {
        const credentials = atob(credentialsEncoded);
        const email = credentials.split('*****')[0];
        const password = credentials.split('*****')[1];
        console.log('Got Credentials:', credentialsEncoded, '\nGot Project Id:', projectId);
        await signIn(email, password);
        dispatch(setSelectedProject({project: {id: projectId}, source: ''}));
        const newEncodedLogin = Base64.encode(email + ':' + password);
        await loadProjectWeb(projectId, newEncodedLogin);
      }
      catch (err) {
        throw Error(err);
      }
    }
    else throw Error('Credentials not found.');
  };

  return {
    autoLogIn,
  };
};

export default useAutoLogIn;
