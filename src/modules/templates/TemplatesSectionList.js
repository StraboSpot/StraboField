import React from 'react';
import {SectionList} from 'react-native';

import {useSelector} from 'react-redux';

import TemplateListItem from './TemplateListItem';
import TemplateSectionHeader from './TemplateSectionHeader';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';

const TemplatesSectionList = ({handleTemplatePressed}) => {

  const templates = useSelector(state => state.project.project?.templates);

  const templatesSectioned = Object.entries(templates).reduce((acc, [key, value]) => {
    if (isEmpty(value) || (value.templates && isEmpty(value.templates))) return acc;
    else if (key === 'activeMeasurementTemplates' || key === 'useMeasurementTemplates') return acc;
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

  const templatesSectionedSorted = templatesSectioned.map(section => ({
    ...section,
    data: section.data.sort((a, b) => a.name.localeCompare(b.name)),
  })).sort((a, b) => a.title.localeCompare(b.title));

  const renderTemplateListItem = ({item, section}) => {
    return (
      <TemplateListItem
        id={item.id}
        onPress={() => handleTemplatePressed(item, section)}
        title={item.name}
      />
    );
  };

  return (
    <SectionList
      ItemSeparatorComponent={FlatListItemSeparator}
      keyExtractor={(item, index) => item + index}
      renderItem={renderTemplateListItem}
      renderSectionHeader={props => <TemplateSectionHeader {...props}/>}
      sections={templatesSectionedSorted}
      stickySectionHeadersEnabled={true}
    />
  );
};

export default TemplatesSectionList;
