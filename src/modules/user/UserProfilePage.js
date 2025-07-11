import React, {useRef, useState} from 'react';
import {FlatList, PermissionsAndroid, Platform, Text, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {Button, Icon, Overlay} from '@rn-vui/base';
import {Formik} from 'formik';
import {Base64} from 'js-base64';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

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
import alert from '../../shared/ui/alert';
import TextInputModal from '../../shared/ui/TextInputModal';
import {Form, useForm} from '../form';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../home/home.slice';
import overlayStyles from '../home/overlays/overlay.styles';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';

const UserProfilePage = () => {
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
  const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [shouldUpdateImage, setShouldUpdateImage] = useState(false);
  const [tempUserProfileImage, setTempUserProfileImage] = useState(null);

  const navigation = useNavigation();
  const toast = useToast();
  const {copyFiles, deleteFromDevice, deleteProfileImageFile} = useDevice();
  const {downloadUserProfile} = useDownload();
  const {hasErrors, validateForm} = useForm();
  const {checkPermission} = usePermissions();
  const {clearUser} = useResetState();
  const {authenticateUser, deleteAccount, deleteProfileImage} = useServerRequests();
  const {uploadProfile} = useUpload();
  const {resizeImageForUpload, uploadProfileImage} = useUploadImages();

  const formName = ['general', 'user_profile'];

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
      else setErrorMessage('Wrong password');
    }
    else setErrorMessage('Need to enter your password');
  };

  const onDownloadUserProfile = async () => {
    setIsDownloading(true);
    await downloadUserProfile();
    setIsDownloading(false);
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
        topPosition={10}
        dialogTitle={'DANGER!'}
        overlayTitleText={overlayStyles.importantText}
        buttonText={'DELETE'}
        overlayButtonText={overlayStyles.importantText}
        visible={isDeleteProfileModalVisible}
        onPress={onDeleteProfile}
        closeModal={() => setDeleteProfileModalVisible(false)}
        textAboveInput={isOnline.isInternetReachable ? deleteModalText : offlineText}
        onChangeText={text => handleOnChange(text)}
        errorMessage={errorMessage}
        onSubmitEditing={onDeleteProfile}
      />
    );
  };

  const handleOnChange = (text) => {
    if (!isEmpty(errorMessage)) setErrorMessage('');
    setDeleteProfileInputValue(text);
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

  const saveForm = async () => {
    try {
      const formCurrent = formRef.current;
      setIsUploading(true);
      await formRef.current.submitForm();
      let newValues = JSON.parse(JSON.stringify(formCurrent.values));
      if (hasErrors(formCurrent)) throw Error('Error in form.');
      const {email, encoded_login, isAuthenticated, sesar, ...userValuesToUpdate} = newValues;
      dispatch(setUserData(userValuesToUpdate));
      if (isOnline.isInternetReachable) {
        await uploadProfile(userValuesToUpdate);
        toast.show('Profile uploaded successfully!', {type: 'success'});
        dispatch(setSidePanelVisible({bool: false}));
      }
      else toast.show('Not connected to internet to upload profile changes', {type: 'warning'});
      setIsSaveButtonDisabled(true);
      setIsUploading(false);
    }
    catch (err) {
      console.error('Error uploading profile', err);
      toast.show('Error uploading profile', {type: 'danger'});
      setIsUploading(false);
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

  const closeProfileImageModal = () => {
    setImageDialogVisible(false);
    setTempUserProfileImage(null);
  };

  const openProfileImageModal = () => {
    setShouldUpdateImage(false);
    setImageDialogVisible(true);
  };

  const renderProfileImageModal = () => {
    return (
      <Overlay
        supportedOrientations={['portrait', 'landscape']}
        overlayStyle={userStyles.imageSelectionModal}
        isVisible={isImageDialogVisible}
      >
        <View style={{alignItems: 'flex-end'}}>
          <Icon
            name={'close-outline'}
            type={'ionicon'}
            onPress={closeProfileImageModal}
          />
        </View>
        <View style={{alignItems: 'center'}}>
          <UserProfileAvatar size={'xlarge'} tempUserProfileImageURI={tempUserProfileImage?.uri}/>
        </View>
        <Button
          containerStyle={commonStyles.buttonContainer}
          buttonStyle={{borderRadius: 10}}
          title={'Gallery'}
          type={'outline'}
          onPress={() => pickImageSource('gallery')}
        />
        <Button
          containerStyle={commonStyles.buttonContainer}
          buttonStyle={{borderRadius: 10}}
          title={'Camera'}
          type={'outline'}
          onPress={() => pickImageSource('camera')}
        />
        <Button
          containerStyle={commonStyles.buttonContainer}
          buttonStyle={{borderRadius: 10}}
          title={'Remove Profile Image'}
          type={'outline'}
          onPress={removeProfileImage}
          loading={isDeletingProfileImage}
        />
        <Button
          containerStyle={commonStyles.buttonContainer}
          disabled={isEmpty(tempUserProfileImage)}
          buttonStyle={{borderRadius: 10}}
          title={'Upload New Profile Image'}
          onPress={saveImage}
          loading={isUploadingProfileImage}
        />
      </Overlay>
    );
  };

  const validate = (values) => {
    validateForm({formName: formName, values: values});
    setIsSaveButtonDisabled(false);
  };

  return (
    <>
      <SidePanelHeader
        title={'My StraboSpot'}
        headerTitle={'Account'}
        backButton={() => {
          console.log('Is User Profile page dirty?', formRef.current.dirty);
          if (!formRef?.current?.dirty) dispatch(setSidePanelVisible({bool: false}));
          else {
            alert(
              'Changes Were Made',
              'Do you want to save your changes?',
              [
                {text: 'Save Changes', onPress: async () => await saveForm()},
                {text: 'Clear Changes', onPress: () => dispatch(setSidePanelVisible({bool: false}))},
              ],
            );
          }
        }}
      />
      <View style={{flex: 1}} pointerEvents={isOnline.isInternetReachable ? 'auto' : 'none'}>
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
                innerRef={formRef}
                onSubmit={values => console.log('Submitting form...', values)}
                validate={values => validate(values)}
                component={formProps => Form({formName: formName, ...formProps})}
                initialValues={userData}
                validateOnChange={true}
                enableReinitialize={true}  // Update values if preferences change while form open
              />
              {isOnline.isInternetReachable ? (
                <View style={userStyles.saveButtonContainer}>
                  <Button
                    onPress={saveForm}
                    type={'clear'}
                    title={'Save Profile Changes'}
                    disabled={isSaveButtonDisabled}
                    loading={isUploading}
                    loadingProps={userStyles.loadingSpinnerProps}
                  />
                  {Platform.OS !== 'web' && (
                    <View style={commonStyles.buttonContainer}>
                      <Button
                        onPress={onDownloadUserProfile}
                        type={'clear'}
                        title={'Download Profile'}
                        loading={isDownloading}
                        loadingProps={userStyles.loadingSpinnerProps}
                      />
                    </View>
                  )}
                  <View style={commonStyles.buttonContainer}>
                    <Button
                      title={'Delete Account'}
                      type={'clear'}
                      onPress={() => setDeleteProfileModalVisible(true)}
                      containerStyle={userStyles.deleteProfileButtonContainer}
                      titleStyle={userStyles.deleteProfileButtonText}
                    />
                  </View>
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
    </>
  );
};

export default UserProfilePage;
