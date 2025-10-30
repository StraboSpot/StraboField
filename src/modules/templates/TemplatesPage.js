import React, {useState} from 'react';
import {SectionList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import TemplateDetail from './TemplateDetail';
import useTemplates from './useTemplates';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import MainMenuPanelHeader from '../main-menu-panel/MainMenuPanelHeader';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';

const TemplatesPage = () => {

  const templates = useSelector(state => state.project.project?.templates);

  const {getTemplateTitle} = useTemplates();

  const [templateVisible, setTemplateVisible] = useState(null);
  const [templateType, setTemplateType] = useState(null);

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
  };

  const handleTemplatePressed = (templatePressed, section) => {
    console.log('section', section);
    setTemplateType(section.title);
    setTemplateVisible(templatePressed);
  };

  const renderItem = ({item, section}) => {
    // console.log('item', item);
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

  const renderMenuSectionHeader = ({section}) => {
    const title = getTemplateTitle(section.title);
    return <SectionDivider dividerText={title}/>;
  };

  const renderTemplateDetail = () => {
    console.log('templateVisible', templateVisible);
    return (
      <>
        <SidePanelHeader
          backButton={handleBackPressed}
          headerTitle={getTemplateTitle(templateType) + ' Template'}
          title={'Templates'}
          // title={template === template ? 'Datasets' : 'Datasets (Save Changes)'}
        />
        <TemplateDetail goBack={handleBackPressed} template={templateVisible} templateType={templateType}/>
      </>
    );
  };

  const renderTemplatesList = () => {
    return (
      <>
        <MainMenuPanelHeader/>
        <SectionList
          ItemSeparatorComponent={FlatListItemSeparator}
          keyExtractor={(item, index) => item + index}
          renderItem={renderItem}
          renderSectionHeader={renderMenuSectionHeader}
          sections={templateSectionSorted}
          stickySectionHeadersEnabled={true}
        />
      </>
    );
  };

  return (
    <>
      {isEmpty(templateVisible) ? renderTemplatesList() : renderTemplateDetail()}
    </>
  );
};

export default TemplatesPage;
