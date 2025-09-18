import React, {useState} from 'react';
import {View} from 'react-native';

import {useDispatch} from 'react-redux';

import ConfirmOverwriteModal from './ConfirmOverwriteModal';
import NewProjectForm from './NewProjectForm';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';

const NewProjectPage = () => {
  const dispatch = useDispatch();

  const [isConfirmOverwriteModalVisible, setIsConfirmOverwriteModalVisible] = useState(true);

  const backToStraboField = () => dispatch(setSidePanelVisible({bool: false}));

  const closeConfirmOverwriteModal = () => setIsConfirmOverwriteModalVisible(false);

  return (
    <>
      <View style={{flex: 1}}>
        <SidePanelHeader
          backButton={backToStraboField}
          headerTitle={'New Project Metadata'}
          title={'StraboField Projects'}
        />
        <NewProjectForm/>
      </View>

      {/* Modal */}
      {isConfirmOverwriteModalVisible && (
        <ConfirmOverwriteModal
          closeModal={backToStraboField}
          loadProject={closeConfirmOverwriteModal}
        />
      )}
    </>
  );
};

export default NewProjectPage;
