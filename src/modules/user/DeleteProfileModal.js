import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';

import {Input} from '@rn-vui/base';
import {Base64} from 'js-base64';
import {useToast} from 'react-native-toast-notifications';

import userStyles from './user.styles';
import useResetState from '../../services/useResetState';
import useServerRequests from '../../services/useServerRequests';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import {RED} from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';


const DeleteProfileModal = ({email, isDeleteProfileModalVisible, isOnline, setDeleteProfileModalVisible}) => {

  const [confirmDeleteMessageVisible, setConfirmDeleteMessageVisible] = useState(false);
  const [deleteProfileInputValue, setDeleteProfileInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const toast = useToast();
  const {clearUser} = useResetState();
  const {authenticateUser, deleteAccount} = useServerRequests();


  const handleOnChange = (text) => {
    if (!isEmpty(errorMessage)) setErrorMessage('');
    setDeleteProfileInputValue(text);
  };

  const handleDeleteModalClose = () => {
    console.log('handleDeleteModalClose');
    setDeleteProfileModalVisible(false);
    setDeleteProfileInputValue('');
    setErrorMessage('');
    // setConfirmDeleteMessageVisible(false);
  };

  const authenticate = async () => {
    if (!isEmpty(deleteProfileInputValue)) {
      const isAuthenticated = await authenticateUser(email, deleteProfileInputValue);
      if (isAuthenticated.valid === 'true') setConfirmDeleteMessageVisible(true);
      else {
        setErrorMessage('Wrong password');
        setDeleteProfileInputValue('');
      }
    }
    else setErrorMessage('Need to enter your password');
  };

  const onDeletePressed = async () => {
    const encodedLogin = Base64.encode(`${email}:${deleteProfileInputValue}`);
    console.log(encodedLogin);
    const res = await deleteAccount(encodedLogin);
    console.log('ACCOUNT DELETED!', res);
    setDeleteProfileModalVisible(false);
    clearUser();  // Navigation happens automatically when clearUser() sets isAuthenticated to false
    toast.show('Account Successfully Deleted!', {type: 'success', duration: 2000});
  };

  const goBack = () => {
    setConfirmDeleteMessageVisible(false);
    setDeleteProfileInputValue('');
    setErrorMessage('');
  };

  const deleteModalText = (
    <View>
      <Text style={userStyles.deleteProfileText}>
        Deleting your account will<Text style={overlayStyles.importantText}> PERMANENTLY </Text>
        remove all data for user{'\n'}{email}{'\n'}from StraboSpot!
      </Text>
      <Text style={userStyles.deleteProfileText}>Enter password to delete:</Text>
    </View>
  );

  const offlineText = <Text style={userStyles.deleteProfileText}>You must be online in order to delete your
    account.</Text>;

  return (
    <ModalWrapper
      overlayStyleOverride={{height: 'auto'}}
      actionTitle={'Delete Account'}
      cancelTitle={confirmDeleteMessageVisible ? 'Back' : 'Close'}
      headerTitle={'DANGER!'}
      isVisible={isDeleteProfileModalVisible}
      onActionPressed={authenticate}
      onCancelPress={confirmDeleteMessageVisible ? goBack : handleDeleteModalClose}
      showActionButton={!confirmDeleteMessageVisible}
    >
      {!confirmDeleteMessageVisible ? <View>
          {isOnline.isInternetReachable ? deleteModalText : offlineText}
          <Input
            autoCapitalize={'none'}
            errorMessage={errorMessage}
            inputContainerStyle={overlayStyles.inputContainer}
            onChangeText={text => handleOnChange(text)}
            placeholder={' Enter password here...'}
            placeholderTextColor={themes.MEDIUMGREY}
            value={deleteProfileInputValue}
          />
        </View>
        : (
          <View>
            <Text style={userStyles.deleteProfileText}>Are you sure you want to delete your account?</Text>
            <Text style={userStyles.deleteProfileText}>This action cannot be undone.</Text>
            <View style={{flexDirection: 'row', justifyContent: 'center'}}>
              <Pressable
                onLongPress={onDeletePressed}
                onPressIn={({pressed}) => console.log('pressed', pressed)}
                style={({pressed}) => [{
                  backgroundColor: pressed ? 'rgb(210, 230, 255)' : 'white',
                  alignItems: 'center',
                  padding: 10,
                  borderColor: RED,
                  borderWidth: 1,
                  borderRadius: 10,
                  width: '50%',
                }]}
              >
                <Text>DELETE</Text>
              </Pressable>
            </View>
            <Text style={{textAlign: 'center', margin: 5}}>Long press to delete</Text>
          </View>
        )}

    </ModalWrapper>
    // <>
    //   <TextInputModal
    //     buttonText={'DELETE'}
    //     dialogTitle={'DANGER!'}
    //     errorMessage={errorMessage}
    //     onActionPressed={confirmDelete}
    //     onCancelPress={handleDeleteModalClose}
    //     onChangeText={text => handleOnChange(text)}
    //     textAboveInput={isOnline?.isInternetReachable ? deleteModalText : offlineText}
    //     value={deleteProfileInputValue}
    //     visible={isDeleteProfileModalVisible}
    //   >
    //     {confirmDeleteMessageVisible && <View>
    //       <Text>HI</Text>
    //     </View>}
    //   </TextInputModal>
    // </>
  );
};

export default DeleteProfileModal;
