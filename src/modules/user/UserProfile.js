import React, {useState} from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {logout} from './userProfile.slice';
import useResetState from '../../services/useResetState';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import StandardModal from '../../shared/ui/StandardModal';
import overlayStyles from '../home/overlays/overlay.styles';
import {MAIN_MENU_ITEMS} from '../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage} from '../main-menu-panel/mainMenuPanel.slice';

const UserProfile = () => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state.user);

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const {clearUser} = useResetState();

  const openUploadAndBackupPage = () => {
    setIsLogoutModalVisible(false);
    setTimeout(() => {          // Added timeOut cause state of modal wasn't changing fast enough
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP}));
    }, 200);
  };

  const renderLogInOrOutButton = () => {
    return (
      <View>
        <Button
          onPress={() => isEmpty(userData.name) ? dispatch(logout()) : setIsLogoutModalVisible(true)}
          title={isEmpty(userData.name) ? 'Log In' : 'Log out'}
          containerStyle={commonStyles.standardButtonContainer}
          buttonStyle={commonStyles.standardButton}
          titleStyle={commonStyles.standardButtonText}
        />
        {isEmpty(userData.name) && (
          <Button
            onPress={clearUser}
            title={isEmpty(userData.name) && 'Clear and Return to Log In'}
            containerStyle={commonStyles.standardButtonContainer}
            buttonStyle={commonStyles.standardButton}
            titleStyle={commonStyles.standardButtonText}
          />
        )}
      </View>
    );
  };

  const renderLogoutModal = () => {
    return (
      <StandardModal
        visible={isLogoutModalVisible}
        dialogTitle={'Log Out?'}
      >
        <Text style={overlayStyles.statusMessageText}>
          Logging out will
          <Text style={overlayStyles.importantText}> ERASE </Text>
          local data. Please make sure you saved changes to the server or device.
        </Text>
        <View style={overlayStyles.buttonContainer}>
          <Button
            title={'Backup'}
            type={'clear'}
            onPress={() => openUploadAndBackupPage()}/>
          <Button
            title={'Logout'}
            titleStyle={overlayStyles.importantText}
            onPress={clearUser}
            type={'clear'}
          />
        </View>
        <Button
          title={'Cancel'}
          onPress={() => setIsLogoutModalVisible(false)} type={'clear'}
          containerStyle={overlayStyles.buttonContainer}/>
      </StandardModal>
    );
  };

  return (
    <>
      {renderLogInOrOutButton()}
      {renderLogoutModal()}
    </>
  );
};

export default UserProfile;
