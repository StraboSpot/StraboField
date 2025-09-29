import React, {useState} from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {logout} from './userProfile.slice';
import useResetState from '../../services/useResetState';
import {isEmpty} from '../../shared/Helpers';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import {MAIN_MENU_ITEMS} from '../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage} from '../main-menu-panel/mainMenuPanel.slice';

const LogOut = () => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state.user);

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const {clearUser} = useResetState();

  const goToBackupPage = () => {
    setIsLogoutModalVisible(false);
    setTimeout(() => {          // Added timeOut cause state of modals wasn't changing fast enough
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP}));
    }, 200);
  };

  const renderLogInOrOutButton = () => {
    return (
      <View style={{paddingHorizontal: 10}}>
        <OutlineButton
          onPress={() => isEmpty(userData.name) ? dispatch(logout()) : setIsLogoutModalVisible(true)}
          title={isEmpty(userData.name) ? 'Log In' : 'Log Out'}
        />
        {isEmpty(userData.name) && (
          <OutlineButton
            onPress={clearUser}
            title={isEmpty(userData.name) && 'Clear and Return to Log In'}
          />
        )}
      </View>
    );
  };

  const renderLogoutModal = () => {
    return (
      <ModalWrapper
        closeModal={() => setIsLogoutModalVisible(false)}
        headerTitle={'Log Out?'}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <View>
          <Text style={[overlayStyles.importantText, {padding: 5, paddingTop: 20}]}>
            Please make sure to backup your{'\n'}project before logging out.
          </Text>
          <View style={{padding: 10}}>
            <ActionButton onPress={clearUser} title={'Log Out'}/>
            <OutlineButton onPress={goToBackupPage} title={'Go to Backup Page'}/>
          </View>
        </View>
      </ModalWrapper>
    );
  };

  return (
    <>
      {renderLogInOrOutButton()}
      {isLogoutModalVisible && renderLogoutModal()}
    </>
  );
};

export default LogOut;
