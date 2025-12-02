import React, {useState} from 'react';

import NewTemplateSectionList from './NewTemplateSectionList';
import TemplateDetail from './TemplateDetail';
import TemplatesSectionList from './TemplatesSectionList';
import useTemplates from './useTemplates';
import {isEmpty} from '../../shared/Helpers';
import AddButton from '../../shared/ui/buttons/AddButton';
import MainMenuPanelHeader from '../main-menu-panel/MainMenuPanelHeader';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';

const Templates = () => {

  const [isNewTemplateListVisible, setIsNewTemplateListVisible] = useState(false);
  const [templateType, setTemplateType] = useState(null);
  const [templateVisible, setTemplateVisible] = useState(null);

  const {getTemplateTitle} = useTemplates();

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

  const renderNewTemplateSectionList = () => {
    return (
      <>
        <SidePanelHeader
          backButton={handleBackPressed}
          headerTitle={'Create New Template'}
          title={'TemplatesNotebook'}
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
          title={'TemplatesNotebook'}
        />
        <TemplateDetail goBack={handleBackPressed} template={templateVisible} templateType={templateType}/>
      </>
    );
  };

  const renderTemplatesSectionList = () => {
    return (
      <>
        <MainMenuPanelHeader/>
        <AddButton onPress={handleCreateNewTemplatePressed} title={'Create New Template'}/>
        <TemplatesSectionList handleTemplatePressed={handleTemplatePressed}/>
      </>
    );
  };


  return (
    <>
      {isNewTemplateListVisible ? renderNewTemplateSectionList()
        : isEmpty(templateVisible) ? renderTemplatesSectionList()
          : renderTemplateDetail()}
    </>
  );
};

export default Templates;
