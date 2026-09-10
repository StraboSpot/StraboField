import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Input} from '@rn-vui/base';
import {Base64} from 'js-base64';
import {useDispatch, useSelector} from 'react-redux';

import useServerRequests from '../../services/network/useServerRequests';
import {isEmpty} from '../../shared/helpers';
import * as themes from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import useIsConnectionAvailable from '../connections/useConnectionStatus';
import {
  setIsProgressModalVisible,
  setIsSessionExpiredModalVisible,
  setIsStatusMessagesModalVisible,
  setIsUploadModalVisible,
} from '../home/home.slice';
import {setUserData} from '../user/userProfile.slice';

// Shown over the current screen (map, notebook, etc.) when an authenticated request comes back 401 — i.e. the stored
// credentials went stale (e.g. the password was changed on the website). Re-authenticating here refreshes the stored
// encoded_login in place, so the user keeps their map and any unsynced data instead of being bounced to sign-in.
const ReauthModal = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const email = useSelector(state => state.user.email);
  const isVisible = useSelector(state => state.home.isSessionExpiredModalVisible);

  const {authenticateUser} = useServerRequests();
  const isConnectionAvailable = useIsConnectionAvailable();

  /* Local State */

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  /* Side Effects */

  // A 401 often surfaces mid-operation while a transient network modal (the download/upload status or
  // progress modal) is on screen. Those are native RN Modals, and iOS drops a second Modal presented over
  // a first — which is why this prompt didn't appear during a project download. This modal renders as an
  // in-place overlay (doesRenderAsView) rather than a native Modal so it never competes in that layer, and
  // we dismiss those transient modals when it appears so nothing sits on top of it.
  useEffect(() => {
    if (isVisible) {
      dispatch(setIsStatusMessagesModalVisible(false));
      dispatch(setIsUploadModalVisible(false));
      dispatch(setIsProgressModalVisible(false));
    }
  }, [isVisible, dispatch]);

  /* Event Handlers */

  const handleOnChange = (text) => {
    if (!isEmpty(errorMessage)) setErrorMessage('');
    setPassword(text);
  };

  // Dismiss without re-authenticating. The app is offline-first, so unsynced data stays safe on the device and the user
  // can keep working; the modal will reappear the next time a sync hits a 401.
  const handleContinueOffline = () => {
    dispatch(setIsSessionExpiredModalVisible(false));
    setPassword('');
    setErrorMessage('');
  };

  const handleLogIn = async () => {
    if (isEmpty(password)) {
      setErrorMessage('Enter your password');
      return;
    }
    try {
      setLoading(true);
      const res = await authenticateUser(email, password);
      if (res?.valid === 'true') {
        dispatch(setUserData({encoded_login: Base64.encode(`${email}:${password}`)}));
        dispatch(setIsSessionExpiredModalVisible(false));
        setPassword('');
        setErrorMessage('');
      }
      else {
        setErrorMessage('Incorrect password. Please try again.');
        setPassword('');
      }
    }
    catch (err) {
      setErrorMessage('Unable to sign in right now. Check your connection and try again.');
    }
    finally {
      setLoading(false);
    }
  };

  /* View */

  return (
    <ModalWrapper
      actionTitle={'Log In'}
      cancelTitle={'Continue Offline'}
      disabled={isEmpty(password) || !isConnectionAvailable}
      doesRenderAsView
      headerTitle={'Session Expired'}
      isLoading={loading}
      isVisible={isVisible}
      onActionPressed={handleLogIn}
      onCancelPress={handleContinueOffline}
      overlayStyleOverride={{height: 'auto'}}
      showActionButton
    >
      <View>
        <Text style={styles.messageText}>
          Your session has expired or your password has changed. Log in again to keep syncing.
        </Text>
        <Text style={styles.messageText}>Your map and any unsynced data are safe on this device.</Text>
        {!isEmpty(email) && <Text style={styles.emailText}>{email}</Text>}
        {!isConnectionAvailable && (
          <Text style={styles.offlineText}>You must be online to log in.</Text>
        )}
        <Input
          autoCapitalize={'none'}
          autoCorrect={false}
          errorMessage={errorMessage}
          inputContainerStyle={overlayStyles.inputContainer}
          onChangeText={text => handleOnChange(text)}
          placeholder={' Enter password here...'}
          placeholderTextColor={themes.MEDIUMGREY}
          secureTextEntry={true}
          value={password}
        />
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  emailText: {
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  messageText: {
    marginBottom: 10,
    textAlign: 'center',
  },
  offlineText: {
    color: themes.RED,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ReauthModal;
