import React, {useState} from 'react';
import {SectionList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import TemplateDetail from './TemplateDetail';
import useTemplates from './useTemplates';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import AddButton from '../../shared/ui/buttons/AddButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import MainMenuPanelHeader from '../main-menu-panel/MainMenuPanelHeader';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';

const TemplatesPage = () => {

  const templates = useSelector(state => state.project.project?.templates);

  const {getNewTemplatesList, getTemplateTitle} = useTemplates();

  const [isNewTemplateListVisible, setIsNewTemplateListVisible] = useState(false);
  const [templateType, setTemplateType] = useState(null);
  const [templateVisible, setTemplateVisible] = useState(null);

  getNewTemplatesList();

  const templateSections = Object.entries(templates).reduce((acc, [key, value]) => {
    if (key === 'activeMeasurementTemplates' || key === 'useMeasurementTemplates') return acc;
    else if (key === 'measurementTemplates') {
      // Split measurement templates into planar, tabular and linear
      const measurementsGroupedByType = value.reduce((acc1, v) => {
        const type = v.values.type;
        if (!acc1[type]) acc1[type] = [];
        acc1[type].push(v);
        return acc1;
      }, {});
      // console.log('measurementsGroupedByType', measurementsGroupedByType);
      return [...acc, ...Object.entries(measurementsGroupedByType).map(([k, v]) => ({title: k, data: v}))];
    }
    else if (value.templates) return [...acc, {title: key, data: value?.templates}];
    else return acc;
  }, []);

  const templateSectionSorted = templateSections.map(section => ({
    ...section,
    data: section.data.sort((a, b) => a.name.localeCompare(b.name)),
  })).sort((a, b) => a.title.localeCompare(b.title));

  const handleBackPressed = () => {
    setTemplateVisible(null);
    setIsNewTemplateListVisible(false);
  };

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

  const renderMenuSectionHeader = ({section}) => {
    const title = getTemplateTitle(section.title);
    return <SectionDivider dividerText={title}/>;
  };

  const renderNewTemplateListItem = ({item, section}) => {
    const title = getTemplateTitle(item);
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        key={item}
        onPress={() => handleNewTemplatePressed(item, section)}
      >
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{title}</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  const renderNewTemplatesList = () => {
    const newTemplatesListSectioned = getNewTemplatesList();
    const newTemplatesListSectionedSorted = newTemplatesListSectioned.sort((a, b) => a.title.localeCompare(b.title));
    return (
      <>
        <SidePanelHeader
          backButton={handleBackPressed}
          headerTitle={'Create New Template'}
          title={'Templates'}
        />
        <SectionList
          ItemSeparatorComponent={FlatListItemSeparator}
          keyExtractor={(item, index) => item + index}
          renderItem={renderNewTemplateListItem}
          renderSectionHeader={renderMenuSectionHeader}
          sections={newTemplatesListSectionedSorted}
          stickySectionHeadersEnabled={true}
        />
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

  const renderTemplateListItem = ({item, section}) => {
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        key={item.id}
        onPress={() => handleTemplatePressed(item, section)}
      >
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{item.name}</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  const renderTemplatesList = () => {
    return (
      <>
        <MainMenuPanelHeader/>
        <AddButton onPress={() => setIsNewTemplateListVisible(true)} title={'Create New Template'}/>
        <SectionList
          ItemSeparatorComponent={FlatListItemSeparator}
          keyExtractor={(item, index) => item + index}
          renderItem={renderTemplateListItem}
          renderSectionHeader={renderMenuSectionHeader}
          sections={templateSectionSorted}
          stickySectionHeadersEnabled={true}
        />
      </>
    );
  };

  return (
    <>
      {isNewTemplateListVisible ? renderNewTemplatesList()
        : isEmpty(templateVisible) ? renderTemplatesList()
          : renderTemplateDetail()}
    </>
  );
};

export default TemplatesPage;
