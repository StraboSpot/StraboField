import React, {useState} from 'react';

import BackupTemplatesModal from './BackupTemplatesModal';
import LoadTemplatesModal from './LoadTemplatesModal';
import NewTemplateSectionList from './NewTemplateSectionList';
import TemplateDetail from './TemplateDetail';
import TemplatesOverflowMenuModal from './TemplatesOverflowMenuModal';
import TemplatesSectionList from './TemplatesSectionList';
import useTemplates from './useTemplates';
import {isEmpty} from '../../shared/helpers';
import AddButton from '../../shared/ui/buttons/AddButton';
import UnsavedChangesModal from '../../shared/ui/modals/UnsavedChangesModal';
import MainMenuPanelHeader from '../main-menu-panel/MainMenuPanelHeader';
import SidePanelHeader from '../main-menu-panel/side-panel/SidePanelHeader';
import {LeavePageContext} from '../notebook-panel/LeavePageContext';
import useLeavePage from '../notebook-panel/useLeavePage';

// The template being edited asks about its unsaved changes through a gate of its own, not the notebook page's: the
// notebook can be open beside the main menu, and leaving a notebook page doesn't leave the template.
const Templates = () => {
  /* Data Hooks */

  const templateGate = useLeavePage({isForSpot: false});
  const {getTemplateTitle} = useTemplates();

  /* Local State */

  const [isBackupTemplatesModalVisible, setIsBackupTemplatesModalVisible] = useState(false);
  const [isLoadTemplatesModalVisible, setIsLoadTemplatesModalVisible] = useState(false);
  const [isNewTemplateListVisible, setIsNewTemplateListVisible] = useState(false);
  const [isOverflowMenuVisible, setIsOverflowMenuVisible] = useState(false);
  const [templateType, setTemplateType] = useState(null);
  const [templateVisible, setTemplateVisible] = useState(null);

  /* Event Handlers */

  const handleBackPressed = async () => {
    if (templateGate.hasUnsavedPageChanges() && !await templateGate.confirmLeavePage()) return;
    goBack();
  };

  const handleCreateNewTemplatePressed = () => setIsNewTemplateListVisible(true);

  const handleNewTemplatePressed = (templateTypePressed, section) => {
    setIsNewTemplateListVisible(false);
    setTemplateType(templateTypePressed);
    let newTemplate = {values: {}};
    if (section.title === 'measurement') newTemplate.values.type = templateTypePressed;
    setTemplateVisible(newTemplate);
  };

  const handleTemplatePressed = (templatePressed, section) => {
    setTemplateType(section.title);
    setTemplateVisible(templatePressed);
  };

  /* Logic Helpers */

  const goBack = () => {
    setTemplateVisible(null);
    setIsNewTemplateListVisible(false);
  };

  /* Render Functions */

  const renderNewTemplateSectionList = () => {
    return (
      <>
        <SidePanelHeader
          backButton={handleBackPressed}
          headerTitle={'Create New Template'}
          title={'Templates'}
        />
        <NewTemplateSectionList handleNewTemplatePressed={handleNewTemplatePressed}/>
      </>
    );
  };

  const renderTemplateDetail = () => {
    return (
      <LeavePageContext.Provider value={templateGate}>
        <SidePanelHeader
          backButton={handleBackPressed}
          headerTitle={getTemplateTitle(templateType) + ' Template'}
          title={'Templates'}
        />
        <TemplateDetail goBack={goBack} template={templateVisible} templateType={templateType}/>
      </LeavePageContext.Provider>
    );
  };

  const renderTemplatesSectionList = () => {
    return (
      <>
        <MainMenuPanelHeader onOverflowMenuPress={() => setIsOverflowMenuVisible(true)}/>
        <AddButton onPress={handleCreateNewTemplatePressed} title={'Create New Template'}/>
        <TemplatesSectionList handleTemplatePressed={handleTemplatePressed}/>
      </>
    );
  };

  /* View */

  return (
    <>
      {isNewTemplateListVisible ? renderNewTemplateSectionList()
        : isEmpty(templateVisible) ? renderTemplatesSectionList()
          : renderTemplateDetail()}

      {/* Menus and Modals */}
      <UnsavedChangesModal {...templateGate.leavePromptProps} headerTitle={'Unsaved Changes'}/>
      <TemplatesOverflowMenuModal
        closeMenu={() => setIsOverflowMenuVisible(false)}
        isVisible={isOverflowMenuVisible}
        onAddPress={handleCreateNewTemplatePressed}
        onBackupPress={() => setIsBackupTemplatesModalVisible(true)}
        onLoadPress={() => setIsLoadTemplatesModalVisible(true)}
      />
      {isBackupTemplatesModalVisible && (
        <BackupTemplatesModal closeModal={() => setIsBackupTemplatesModalVisible(false)}/>
      )}
      {isLoadTemplatesModalVisible && (
        <LoadTemplatesModal closeModal={() => setIsLoadTemplatesModalVisible(false)}/>
      )}
    </>
  );
};

export default Templates;
