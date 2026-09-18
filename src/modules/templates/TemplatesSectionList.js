import React from 'react';
import {SectionList} from 'react-native';

import {useSelector} from 'react-redux';

import TemplateListItem from './TemplateListItem';
import {MEASUREMENT_TEMPLATE_KEY} from './templates.constants';
import {getTemplateKeys, getTemplateList} from './templates.helpers';
import TemplateSectionHeader from './TemplateSectionHeader';
import {isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';

const TemplatesSectionList = ({handleTemplatePressed}) => {
  /* Data Hooks */

  const templates = useSelector(state => state.project.project?.templates);

  /* Derived Variables */

  const templatesSectioned = getTemplateKeys(templates).reduce((acc, key) => {
    const templatesForKey = getTemplateList(templates, key);
    if (isEmpty(templatesForKey)) return acc;
    // Measurements are the one key whose templates are not all of a kind - planar, tabular and linear share a
    // bucket and are told apart by type - so they get a section each rather than one for the key.
    else if (key === MEASUREMENT_TEMPLATE_KEY) {
      const measurementsGroupedByType = templatesForKey.reduce((acc1, v) => {
        const type = v.values.type;
        if (!acc1[type]) acc1[type] = [];
        acc1[type].push(v);
        return acc1;
      }, {});
      // console.log('measurementsGroupedByType', measurementsGroupedByType);
      return [...acc, ...Object.entries(measurementsGroupedByType).map(([k, v]) => ({title: k, data: v}))];
    }
    else return [...acc, {title: key, data: templatesForKey}];
  }, []);

  const templatesSectionedSorted = templatesSectioned.map(section => ({
    ...section,
    data: section.data.sort((a, b) => a.name.localeCompare(b.name)),
  })).sort((a, b) => a.title.localeCompare(b.title));

  /* Render Functions */

  const renderTemplateListItem = ({item, section}) => {
    return (
      <TemplateListItem
        id={item.id}
        onPress={() => handleTemplatePressed(item, section)}
        title={item.name}
      />
    );
  };

  /* View */

  return (
    <SectionList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={<ListEmptyText text={'No Templates Found'}/>}
      keyExtractor={(item, index) => item + index}
      renderItem={renderTemplateListItem}
      renderSectionHeader={props => <TemplateSectionHeader {...props}/>}
      sections={templatesSectionedSorted}
      stickySectionHeadersEnabled={true}
    />
  );
};

export default TemplatesSectionList;
