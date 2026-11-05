import React, {useState} from 'react';

import {useSelector} from 'react-redux';

import BackupTemplatesModal from './BackupTemplatesModal';
import LoadTemplatesModal from './LoadTemplatesModal';
import TemplateDetail from './TemplateDetail';
import {getNewTemplateSections, getSavedTemplateSections, getTemplateTypeLabel} from './templateLabels.helpers';
import {MEASUREMENT_TEMPLATE_KEY} from './templates.constants';
import TemplateSectionList from './TemplateSectionList';
import TemplatesOverflowMenuModal from './TemplatesOverflowMenuModal';
import {isEmpty} from '../../shared/helpers';
import AddButton from '../../shared/ui/buttons/AddButton';
import UnsavedChangesModal from '../../shared/ui/modals/UnsavedChangesModal';
import MainMenuPanelHeader from '../main-menu-panel/MainMenuPanelHeader';
import SidePanelHeader from '../main-menu-panel/side-panel/SidePanelHeader';
import {MEASUREMENT_GROUP_KEY} from '../measurements/measurements.constants';
import {LeavePageContext} from '../notebook-panel/LeavePageContext';
import useLeavePage from '../notebook-panel/useLeavePage';

// The template being edited asks about its unsaved changes through a gate of its own, not the notebook page's: the
// notebook can be open beside the main menu, and leaving a notebook page doesn't leave the template.
const Templates = () => {
  /* Data Hooks */

  const templates = useSelector(state => state.project.project?.templates);

  const templateGate = useLeavePage({isForSpot: false});

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

  // The item names a kind of template by its form key, which for a measurement is also the template's type
  const handleNewTemplatePressed = ({id: formKey}, section) => {
    setIsNewTemplateListVisible(false);
    setTemplateType(formKey);
    setTemplateVisible({values: section.groupKey === MEASUREMENT_GROUP_KEY ? {type: formKey} : {}});
  };

  // A measurement section holds more than one type, tabular templates sharing the planar section
  const handleTemplatePressed = (templatePressed, section) => {
    setTemplateType(section.templateKey === MEASUREMENT_TEMPLATE_KEY ? templatePressed.values.type
      : section.templateKey);
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
        <TemplateSectionList onItemPressed={handleNewTemplatePressed} sections={getNewTemplateSections()}/>
      </>
    );
  };

  const renderTemplateDetail = () => {
    return (
      <LeavePageContext.Provider value={templateGate}>
        <SidePanelHeader
          backButton={handleBackPressed}
          headerTitle={getTemplateTypeLabel(templateType) + ' Template'}
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
        <TemplateSectionList
          emptyText={'No Templates Found'}
          onItemPressed={handleTemplatePressed}
          sections={getSavedTemplateSections(templates)}
        />
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
