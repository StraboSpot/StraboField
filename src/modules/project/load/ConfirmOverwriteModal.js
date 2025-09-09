import React from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';

const ConfirmOverwriteModal = ({closeModal, loadProject}) => {
  const dispatch = useDispatch();
  const currentProjectName = useSelector(state => state.project.project?.description?.project_name);

  const goToBackupPage = () => {
    closeModal();
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP}));
  };

  return (
    <ModalWrapper
      closeModal={closeModal}
      title={'Open Project'}
    >
      <View>
        <Text style={overlayStyles.statusMessageText}>
          What do you want to do with the current project ({currentProjectName})?
        </Text>
        <View style={{padding: 10}}>
          <Button
            containerStyle={{padding: 2.5}}
            onPress={loadProject}
            title={'Overwrite'}
          />
          <Button
            containerStyle={{padding: 2.5}}
            onPress={goToBackupPage}
            title={'Go to Backup Page'}
            type={'outline'}
          />
        </View>
      </View>
    </ModalWrapper>
  );
};

export default ConfirmOverwriteModal;
