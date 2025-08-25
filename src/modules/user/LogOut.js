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
import Modal from '../../shared/ui/modal/Modal';
import uiStyles from '../../shared/ui/ui.styles';

const LogOut = () => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state.user);

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const {clearUser} = useResetState();

  const goToBackupPage = () => {
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
      <Modal
        closeModal={() => setIsLogoutModalVisible(false)}
        title={'Log Out?'}
      >
        <View>
          <View style={uiStyles.sectionDivider}>
            <Text style={overlayStyles.importantText}>
              Please make sure to backup your project before logging out.
            </Text>
          </View>
          <View style={{padding: 10}}>
            <Button
              title={'Logout'}
              containerStyle={{padding: 2.5}}
              onPress={clearUser}
            />
            <Button
              title={'Go to Backup Page'}
              type={'outline'}
              containerStyle={{padding: 2.5}}
              onPress={goToBackupPage}
            />
          </View>
        </View>
      </Modal>
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
