import React, {useState} from 'react';
import {Text} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {logout} from './userProfile.slice';
import {isEmpty} from '../../shared/Helpers';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import DeleteConformationDialogBox from '../../shared/ui/modals/DeleteConformationDialogBox';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import useResetState from '../../store/useResetState';
import {MAIN_MENU_ITEMS} from '../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage} from '../main-menu-panel/mainMenuPanel.slice';

const LogOut = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const userData = useSelector(state => state.user);

  const {clearUser} = useResetState();

  /* Local State */

  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  /* Event Handlers */

  const handleDeleteDataPressed = () => setIsDeleteConfirmModalVisible(true);

  /* Logic Helpers */

  const goToBackupPage = () => {
    setIsLogoutModalVisible(false);
    setTimeout(() => {          // Added timeOut cause state of modals wasn't changing fast enough
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP}));
    }, 200);
  };

  /* Render Functions */

  const renderDeleteConfirmationModal = () => {
    return (
      <DeleteConformationDialogBox
        headerTitle={'Confirm Delete Data'}
        isVisible={isDeleteConfirmModalVisible}
        onActionPressed={clearUser}
        onCancelPress={() => setIsDeleteConfirmModalVisible(false)}
      >
        <Text style={{textAlign: 'center'}}>Are you sure you want to delete all of your data?</Text>
      </DeleteConformationDialogBox>
    );
  };

  const renderLogInOrOutButton = () => {
    return (
      <>
        <OutlineButton
          onPress={() => isEmpty(userData.name) ? dispatch(logout()) : setIsLogoutModalVisible(true)}
          title={isEmpty(userData.name) ? 'Log In' : 'Log Out'}
        />
        {isEmpty(userData.name) && (
          <DeleteButton
            onPress={handleDeleteDataPressed}
            title={isEmpty(userData.name) && 'Delete Data & Return to Log In'}
          />
        )}
      </>
    );
  };

  const renderLogoutModal = () => {
    return (
      <ModalWrapper
        closeModal={() => setIsLogoutModalVisible(false)}
        headerTitle={'Log Out?'}
        overlayStyleOverride={{maxHeight: '35%'}}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <Text style={[overlayStyles.importantText, {paddingVertical: 20}]}>
          Please make sure to backup your{'\n'}project before logging out.
        </Text>
        <ActionButton onPress={clearUser} title={'Log Out'}/>
        <OutlineButton onPress={goToBackupPage} title={'Go to Backup Page'}/>
      </ModalWrapper>
    );
  };

  /* View */

  return (
    <>
      {renderLogInOrOutButton()}
      {isLogoutModalVisible && renderLogoutModal()}
      {isDeleteConfirmModalVisible && renderDeleteConfirmationModal()}
    </>
  );
};

export default LogOut;
