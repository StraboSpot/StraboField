import React, {useLayoutEffect, useRef, useState} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {Formik} from 'formik';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import DeleteProfileModal from './DeleteProfileModal';
import LogOut from './LogOut';
import userStyles from './user.styles';
import {setUserData} from './userProfile.slice';
import UserProfileAvatar from './UserProfileAvatar';
import useDevice from '../../services/device/useDevice';
import usePermissions from '../../services/device/usePermissions';
import {APP_DIRECTORIES} from '../../services/files/directories.constants';
import useDownload from '../../services/files/useDownload';
import useUpload from '../../services/files/useUpload';
import useUploadImages from '../../services/files/useUploadImages';
import useServerRequests from '../../services/network/useServerRequests';
import {isEmpty} from '../../shared/helpers';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import ConnectionRequiredMessage from '../../shared/ui/text/ConnectionRequiredMessage';
import {persistor} from '../../store/ConfigureStore';
import useIsConnectionAvailable, {useConnectionTargetText} from '../connections/useConnectionStatus';
import {Form, useForm} from '../form';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../home/home.slice';
import useImageSize from '../images/useImageSize';

const formName = ['general', 'user_profile'];

const UserProfile = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const userData = useSelector(state => state.user);
  const userEncodedLogin = useSelector(state => state.user.encoded_login);

  const isConnectionAvailable = useIsConnectionAvailable();
  const connectionTargetText = useConnectionTargetText();
  const {copyFiles, deleteFromDevice, deleteProfileImageFile} = useDevice();
  const {downloadUserProfile} = useDownload();
  const {hasErrors, validateForm} = useForm();
  const {hasCameraPermission} = usePermissions();
  const {deleteProfileImage} = useServerRequests();
  const toast = useToast();
  const {uploadProfile} = useUpload();
  const {resizeImageForUpload} = useImageSize();
  const {uploadProfileImage} = useUploadImages();

  /* Local State */

  const formRef = useRef(null);

  const [isDeleteProfileModalVisible, setDeleteProfileModalVisible] = useState(false);
  const [isDeletingProfileImage, setIsDeletingProfileImage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImageDialogVisible, setImageDialogVisible] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [shouldUpdateImage, setShouldUpdateImage] = useState(false);
  const [tempUserProfileImage, setTempUserProfileImage] = useState(null);

  /* Side Effects */

  useLayoutEffect(() => {
    return () => doCleanup();
  }, []);

  /* Event Handlers */

  const onDownloadUserProfile = async () => {
    setIsDownloading(true);
    await downloadUserProfile();
    setIsDownloading(false);
  };

  /* Logic Helpers */

  const closeProfileImageModal = () => {
    setImageDialogVisible(false);
    setTempUserProfileImage(null);
  };

  const doCleanup = async () => {
    const formCurrent = formRef.current;
    if (formCurrent?.dirty) await saveForm(formCurrent);
  };

  const getIsDisabled = () => !isConnectionAvailable;

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
      if (await hasCameraPermission()) {
        await launchCamera({}, (response) => {
          console.log('Launch Camera Response', response);
          if (response.didCancel) return;
          if (response) setTempUserProfileImage({...response.assets[0], id: 'profileImage'});
          else return require('../../assets/images/noimage.jpg');
        });
      }
    }
  };

  const purgeRedux = async () => {
    await persistor.purge(); // Use this to clear persistStore completely
    console.log('Redux store purged');
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

  const saveForm = async (formCurrent) => {
    try {
      await formCurrent.submitForm();
      let newValues = JSON.parse(JSON.stringify(formCurrent.values));
      if (hasErrors(formCurrent)) throw Error('Error in form.');
      const {email, encoded_login, image, isAuthenticated, macrostrat, sesar, ...userValuesToUpdate} = newValues;
      dispatch(setUserData(userValuesToUpdate));
      if (isConnectionAvailable) {
        await uploadProfile(userValuesToUpdate);
        toast.show('Profile uploaded successfully!', {type: 'success'});
        toast.show('Changes Saved!', {type: 'success'});
      }
      else toast.show(`Not connected to ${connectionTargetText}. Changes Saved Locally Only`, {type: 'warning'});
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
      const resizedProfileImage = await resizeImageForUpload(tempUserProfileImage);
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

  /* Render Functions */

  const renderProfileImageModal = () => {
    return (
      <ModalWrapper
        closeModal={closeProfileImageModal}
        headerTitle={'Edit Profile Image'}
        isVisible={isImageDialogVisible}
        overlayStyleOverride={{height: 'auto'}}
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

  /* View */

  return (
    <>
      {!isEmpty(userData.email) && !isEmpty(userData.encoded_login) && (
        <View pointerEvents={isConnectionAvailable ? 'auto' : 'none'} style={{flex: 1}}>
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
                {isConnectionAvailable ? (
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
                    {__DEV__ && (
                      <OutlineButton
                        onPress={purgeRedux}
                        title={'Purge Redux Store'}
                      />
                    )}
                  </View>
                ) : <ConnectionRequiredMessage actionText={'make changes to your profile'}/>}

                {/* Modals */}
                {renderProfileImageModal()}
                <DeleteProfileModal
                  email={userData.email}
                  isDeleteProfileModalVisible={isDeleteProfileModalVisible}
                  setDeleteProfileModalVisible={val => setDeleteProfileModalVisible(val)}
                />
              </>
            }
          />
        </View>
      )}
      {Platform.OS !== 'web' && <LogOut/>}
    </>
  );
};

export default UserProfile;
