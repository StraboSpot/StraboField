import {useEffect, useRef} from 'react';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import useServerRequests from '../../services/network/useServerRequests';
import {isEmpty} from '../../shared/helpers';
import {clearProfileUploadNeeded} from '../connections/connections.slice';
import useIsConnectionAvailable from '../connections/useConnectionStatus';

// Headless listener (mounted in App.js). When the user profile or conventions are changed offline they save locally
// and set connections.isProfileUploadNeeded (persisted). This watches for a connection returning and uploads the
// current profile to the server, clearing the flag on success. On failure the flag stays set so the next reconnect
// retries.
const ProfileSyncListener = () => {
  const dispatch = useDispatch();
  const toast = useToast();

  const isConnectionAvailable = useIsConnectionAvailable();
  const isProfileUploadNeeded = useSelector(state => state.connections.isProfileUploadNeeded);
  const user = useSelector(state => state.user);
  const {updateProfile} = useServerRequests();

  // Read the latest profile at upload time without adding `user` to the effect deps (which changes on every edit).
  const userRef = useRef(user);
  userRef.current = user;

  // Guards against overlapping uploads while one is in flight (the effect can re-fire before it resolves).
  const isUploadingRef = useRef(false);

  useEffect(() => {
    const syncProfile = async () => {
      const currentUser = userRef.current;
      if (!isProfileUploadNeeded || !isConnectionAvailable || !currentUser.isAuthenticated
        || isEmpty(currentUser.encoded_login) || isUploadingRef.current) return;

      isUploadingRef.current = true;
      try {
        const {email, encoded_login, image, isAuthenticated, macrostrat, sesar, ...rest} = currentUser;
        // Server echoes default_manual_measurement back as an integer; normalize to a boolean before re-uploading.
        const userValuesToUpload = 'default_manual_measurement' in rest
          ? {...rest, default_manual_measurement: Boolean(rest.default_manual_measurement)}
          : rest;
        await updateProfile(userValuesToUpload);
        dispatch(clearProfileUploadNeeded());
        toast.show('User profile synced to server.', {type: 'success'});
      }
      catch (err) {
        console.error('Error syncing user conventions on reconnect', err);
        // Leave the flag set; the next reconnect will retry.
      }
      finally {
        isUploadingRef.current = false;
      }
    };
    syncProfile();
  }, [isConnectionAvailable, isProfileUploadNeeded, dispatch, toast, updateProfile]);
};

export default ProfileSyncListener;
