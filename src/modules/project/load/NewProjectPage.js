import React, {useState} from 'react';
import {View} from 'react-native';

import {useDispatch} from 'react-redux';

import ConfirmOverwriteModal from './ConfirmOverwriteModal';
import NewProjectForm from './NewProjectForm';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';

const NewProjectPage = ({closeNotebookPanel}) => {
  const dispatch = useDispatch();

  const [isConfirmOverwriteModalVisible, setIsConfirmOverwriteModalVisible] = useState(true);

  const backToStraboField = () => dispatch(setSidePanelVisible({bool: false}));

  const closeConfirmOverwriteModal = () => {
    closeNotebookPanel();
    setIsConfirmOverwriteModalVisible(false);
  };

  return (
    <>
      <View style={{flex: 1}}>
        <SidePanelHeader
          backButton={backToStraboField}
          headerTitle={'New Project Metadata'}
          title={'StraboField Projects'}
        />
        <NewProjectForm closeNotebookPanel={closeNotebookPanel}/>
      </View>

      {/* Modal */}
      <ConfirmOverwriteModal
        closeModal={backToStraboField}
        isVisible={isConfirmOverwriteModalVisible}
        loadProject={closeConfirmOverwriteModal}
        textOverride={'Are you sure you want to start a new project?\n\n Saving a new project will overwrite the current one.'
          + ' Make sure the current project is backed up.'}
      />
    </>
  );
};

export default NewProjectPage;
