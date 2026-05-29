import React, {useState} from 'react';

import BackupTemplatesModal from './BackupTemplatesModal';
import LoadTemplatesModal from './LoadTemplatesModal';
import NewTemplateSectionList from './NewTemplateSectionList';
import TemplateDetail from './TemplateDetail';
import TemplatesOverflowMenuModal from './TemplatesOverflowMenuModal';
import TemplatesSectionList from './TemplatesSectionList';
import useTemplates from './useTemplates';
import {isEmpty} from '../../shared/helpers';
import MainMenuPanelHeader from '../main-menu-panel/MainMenuPanelHeader';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';

const Templates = () => {
  /* Data Hooks */

  const {getTemplateTitle} = useTemplates();

  /* Local State */

  const [isBackupTemplatesModalVisible, setIsBackupTemplatesModalVisible] = useState(false);
  const [isLoadTemplatesModalVisible, setIsLoadTemplatesModalVisible] = useState(false);
  const [isNewTemplateListVisible, setIsNewTemplateListVisible] = useState(false);
  const [isOverflowMenuVisible, setIsOverflowMenuVisible] = useState(false);
  const [templateType, setTemplateType] = useState(null);
  const [templateVisible, setTemplateVisible] = useState(null);

  /* Event Handlers */

  const handleBackPressed = () => {
    setTemplateVisible(null);
    setIsNewTemplateListVisible(false);
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
      <>
        <SidePanelHeader
          backButton={handleBackPressed}
          headerTitle={getTemplateTitle(templateType) + ' Template'}
          title={'Templates'}
        />
        <TemplateDetail goBack={handleBackPressed} template={templateVisible} templateType={templateType}/>
      </>
    );
  };

  const renderTemplatesSectionList = () => {
    return (
      <>
        <MainMenuPanelHeader onOverflowMenuPress={() => setIsOverflowMenuVisible(true)}/>
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
