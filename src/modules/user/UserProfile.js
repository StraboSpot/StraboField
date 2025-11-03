import React, {useLayoutEffect, useRef, useState} from 'react';
import {FlatList, PermissionsAndroid, Platform, Text, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {Formik} from 'formik';
import {Base64} from 'js-base64';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import LogOut from './LogOut';
import userStyles from './user.styles';
import {setUserData} from './userProfile.slice';
import UserProfileAvatar from './UserProfileAvatar';
import {APP_DIRECTORIES} from '../../services/directories.constants';
import useDevice from '../../services/useDevice';
import useDownload from '../../services/useDownload';
import usePermissions from '../../services/usePermissions';
import useResetState from '../../services/useResetState';
import useServerRequests from '../../services/useServerRequests';
import useUpload from '../../services/useUpload';
import useUploadImages from '../../services/useUploadImages';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import TextInputModal from '../../shared/ui/TextInputModal';
import {persistor} from '../../store/ConfigureStore';
import {Form, useForm} from '../form';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../home/home.slice';

const UserProfile = () => {
  const formRef = useRef(null);

  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline);
  const userData = useSelector(state => state.user);
  const userEncodedLogin = useSelector(state => state.user.encoded_login);

  const [deleteProfileInputValue, setDeleteProfileInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleteProfileModalVisible, setDeleteProfileModalVisible] = useState(false);
  const [isDeletingProfileImage, setIsDeletingProfileImage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImageDialogVisible, setImageDialogVisible] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [shouldUpdateImage, setShouldUpdateImage] = useState(false);
  const [tempUserProfileImage, setTempUserProfileImage] = useState(null);

  const navigation = useNavigation();
  const toast = useToast();
  const {authenticateUser, deleteAccount, deleteProfileImage} = useServerRequests();
  const {checkPermission} = usePermissions();
  const {clearUser} = useResetState();
  const {copyFiles, deleteFromDevice, deleteProfileImageFile} = useDevice();
  const {downloadUserProfile} = useDownload();
  const {hasErrors, validateForm} = useForm();
  const {resizeImageForUpload, uploadProfileImage} = useUploadImages();
  const {uploadProfile} = useUpload();

  const formName = ['general', 'user_profile'];

  useLayoutEffect(() => {
    return () => doCleanup();
  }, []);

  const closeProfileImageModal = () => {
    setImageDialogVisible(false);
    setTempUserProfileImage(null);
  };

  const doCleanup = async () => {
    if (formRef.current?.dirty) saveForm(formRef.current);
  };

  const getIsDisabled = () => !(isOnline.isInternetReachable && isOnline.isConnected);

  const handleOnChange = (text) => {
    if (!isEmpty(errorMessage)) setErrorMessage('');
    setDeleteProfileInputValue(text);
  };

  const handleDeleteModalClose = () => {
    setDeleteProfileModalVisible(false);
    setDeleteProfileInputValue('');
    setErrorMessage('');
  };

  const onDeleteProfile = async () => {
    console.log(deleteProfileInputValue);
    if (!isEmpty(deleteProfileInputValue)) {
      const isAuthenticated = await authenticateUser(userData.email, deleteProfileInputValue);
      if (isAuthenticated.valid === 'true') {
        const encodedLogin = Base64.encode(`${userData.email}:${deleteProfileInputValue}`);
        console.log(encodedLogin);
        const res = await deleteAccount(encodedLogin);
        console.log('ACCOUNT DELETED!', res);
        setDeleteProfileModalVisible(false);
        clearUser();
        toast.show('Account Successfully Deleted!', {type: 'success', duration: 2000});
        setTimeout(() => navigation.navigate('SignIn'), 200);
      }
      else {
        setErrorMessage('Wrong password');
        setDeleteProfileInputValue('');
      }
    }
    else setErrorMessage('Need to enter your password');
  };

  const onDownloadUserProfile = async () => {
    setIsDownloading(true);
    await downloadUserProfile();
    setIsDownloading(false);
  };

  const openProfileImageModal = () => {
    setShouldUpdateImage(false);
    setImageDialogVisible(true);
  };

  const pickImageSource = async (source) => {
    if (source === 'gallery') {
      await launchImageLibrary({}, async (response) => {
        console.log('Launch Image Library Response:', response);
        if (response.didCancel) return;
        if (response) setTempUserProfileImage({...response.assets[0], id: 'profileImage'});
        else return require('../../assets/images/noimage.jpg');
      });
    }
    else {
      let permissionGranted;
      console.log(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (Platform.OS === 'android') permissionGranted = await checkPermission(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (permissionGranted === 'granted' || Platform.OS === 'ios') {
        await launchCamera({}, (response) => {
          console.log('Launch Camera Response', response);
          if (response.didCancel) return;
          if (response) setTempUserProfileImage({...response.assets[0], id: 'profileImage'});
          else return require('../../assets/images/noimage.jpg');
        });
      }
    }
  };
  const removeProfileImage = async () => {
    try {
      setIsDeletingProfileImage(true);
      await deleteProfileImage(userEncodedLogin);
      if (Platform.OS !== 'web') await deleteProfileImageFile();
      setShouldUpdateImage(true);
      setIsDeletingProfileImage(false);
      closeProfileImageModal();
      toast.show('Profile Image Removed', {type: 'success'});
    }
    catch (err) {
      console.error('Error deleting profile image', err);
      setIsDeletingProfileImage(false);
      closeProfileImageModal();
    }
  };

  const renderDeleteProfileModal = () => {
    const deleteModalText = (
      <View>
        <Text style={userStyles.deleteProfileText}>
          Deleting your account will<Text style={overlayStyles.importantText}> PERMANENTLY </Text>
          remove all data for user{'\n'}{userData.email}{'\n'}from StraboSpot!
        </Text>
        <Text style={userStyles.deleteProfileText}>Enter password to delete:</Text>
      </View>
    );
    const offlineText = <Text style={userStyles.deleteProfileText}>You must be online in order to delete your
      account.</Text>;

    return (
      <TextInputModal
        buttonText={'DELETE'}
        dialogTitle={'DANGER!'}
        errorMessage={errorMessage}
        onActionPressed={onDeleteProfile}
        onCancelPress={handleDeleteModalClose}
        onChangeText={text => handleOnChange(text)}
        textAboveInput={isOnline.isInternetReachable ? deleteModalText : offlineText}
        value={deleteProfileInputValue}
        visible={isDeleteProfileModalVisible}
      />
    );
  };

  const renderProfileImageModal = () => {
    return (
      <ModalWrapper
        closeModal={closeProfileImageModal}
        headerTitle={'Edit Profile Image'}
        isVisible={isImageDialogVisible}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <View style={{alignItems: 'center'}}>
          <UserProfileAvatar size={'xlarge'} tempUserProfileImageURI={tempUserProfileImage?.uri}/>
        </View>
        <OutlineButton
          onPress={() => pickImageSource('gallery')}
          title={'Gallery'}
        />
        <OutlineButton
          onPress={() => pickImageSource('camera')}
          title={'Camera'}
        />
        <OutlineButton
          loading={isDeletingProfileImage}
          onPress={removeProfileImage}
          title={'Remove Profile Image'}
        />
        <OutlineButton
          disabled={isEmpty(tempUserProfileImage)}
          loading={isUploadingProfileImage}
          onPress={saveImage}
          title={'Upload New Profile Image'}
        />
      </ModalWrapper>
    );
  };

  const saveForm = async () => {
    try {
      const formCurrent = formRef.current;
      await formRef.current.submitForm();
      let newValues = JSON.parse(JSON.stringify(formCurrent.values));
      if (hasErrors(formCurrent)) throw Error('Error in form.');
      const {email, encoded_login, isAuthenticated, sesar, ...userValuesToUpdate} = newValues;
      dispatch(setUserData(userValuesToUpdate));
      if (isOnline.isInternetReachable) {
        await uploadProfile(userValuesToUpdate);
        toast.show('Profile uploaded successfully!', {type: 'success'});
      }
      else toast.show('Not connected to internet to upload profile changes', {type: 'warning'});
      toast.show('Changes Saved!', {type: 'success'});
    }
    catch (err) {
      console.error('Error uploading profile', err);
      toast.show('Error Saving Profile', {type: 'danger'});
    }
  };

  const saveImage = async () => {
    try {
      setIsUploadingProfileImage(true);
      console.log('Need to upload', tempUserProfileImage.uri);
      const resizedProfileImage = await resizeImageForUpload(tempUserProfileImage,
        tempUserProfileImage.uri);
      await copyFiles(resizedProfileImage.uri, APP_DIRECTORIES.PROFILE_IMAGE);
      await deleteFromDevice(resizedProfileImage.uri);
      await uploadProfileImage();
      setShouldUpdateImage(true);
      closeProfileImageModal();
      setIsUploadingProfileImage(false);
      toast.show('Profile image uploaded successfully!', {type: 'success'});
    }
    catch (err) {
      console.error('Error saving new profile image:', err);
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Error uploading profile image: ' + err));
      dispatch(setIsErrorMessagesModalVisible(true));
      closeProfileImageModal();
      setIsUploadingProfileImage(false);
    }
  };

  const purgeRedux = async () => {
    await persistor.purge(); // Use this to clear persistStore completely
    console.log('Redux store purged');
  };

  return (
    <>
      <View pointerEvents={isOnline.isInternetReachable ? 'auto' : 'none'} style={{flex: 1}}>
        <FlatList
          ListHeaderComponent={
            <>
              <View style={{alignItems: 'center', marginTop: 15}}>
                <UserProfileAvatar
                  isEditable={true}
                  openProfileImageModal={openProfileImageModal}
                  shouldUpdateImage={shouldUpdateImage}
                  size={200}
                />
              </View>
              <View style={{alignItems: 'center', padding: 10}}>
                <Text style={userStyles.avatarLabelEmail}>{userData.email}</Text>
              </View>
              <Formik
                component={formProps => Form({formName: formName, getIsDisabled: getIsDisabled, ...formProps})}
                enableReinitialize={true}  // Update values if preferences change while form open
                initialValues={userData}
                innerRef={formRef}
                onSubmit={values => console.log('Submitting form...', values)}
                validate={values => validateForm({formName: formName, values: values})}
                validateOnChange={true}
              />
              {isOnline.isInternetReachable && !isEmpty(userData.email) && !isEmpty(userData.encoded_login) ? (
                <View style={userStyles.saveButtonContainer}>
                  {Platform.OS !== 'web' && (
                    <OutlineButton
                      loading={isDownloading}
                      onPress={onDownloadUserProfile}
                      title={'Download User Profile'}
                    />
                  )}
                  <DeleteButton
                    onPress={() => setDeleteProfileModalVisible(true)}
                    title={'Delete Account'}
                  />
                  {__DEV__ && <OutlineButton
                    onPress={purgeRedux}
                    title={'Purge Redux Store'}
                  />}
                </View>
              ) : (
                <Text style={commonStyles.noValueText}>
                  Must be online to save changes to profile or delete profile.
                </Text>
              )}
              {renderProfileImageModal()}
              {renderDeleteProfileModal()}
            </>
          }
        />
      </View>

      {Platform.OS !== 'web' && <LogOut/>}
    </>
  );
};

export default UserProfile;
