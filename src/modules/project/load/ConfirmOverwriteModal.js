import React from 'react';
import {Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import ActionButton from '../../../shared/ui/buttons/ActionButton';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';

const ConfirmOverwriteModal = ({
                                 closeModal,
                                 isVisible,
                                 loadProject,
                                 project,
                                 textOverride,
                               }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentProjectName = useSelector(state => state.project.project?.description?.project_name);
  const sidePanelView = useSelector(state => state.mainMenu?.sidePanelView);

  /* Derived Variables */

  const modalText = textOverride ? textOverride
    : `You are going to overwrite the project \n${currentProjectName} \nwith the project 
    ${(project?.name || project?.fileName)}.`;

  /* Logic Helpers */

  const actionButtonTitle = () => sidePanelView === 'New Project' ? 'Continue' : 'Overwrite Project';

  const goToBackupPage = () => {
    closeModal();
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.BACKUP}));
  };

  const headerTitle = () => `Overwrite Project ${currentProjectName}?`;

  /* View */

  return (
    <ModalWrapper
      actionTitle={'Cancel'}
      closeModal={closeModal}
      headerTitle={headerTitle()}
      isVisible={isVisible}
      overlayStyleOverride={{height: 'auto'}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton
    >
      <View>
        <Text style={overlayStyles.statusMessageText}>{modalText}</Text>
        <View style={[commonStyles.standardDescriptionText, {padding: 10}]}>
          <ActionButton onPress={loadProject} title={actionButtonTitle()}/>
          <OutlineButton onPress={goToBackupPage} title={'Go to Backup Page'}/>
        </View>
      </View>
    </ModalWrapper>
  );
};

export default ConfirmOverwriteModal;
