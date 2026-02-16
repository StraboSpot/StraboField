import React from 'react';
import {SectionList} from 'react-native';

import TemplateListItem from './TemplateListItem';
import TemplateSectionHeader from './TemplateSectionHeader';
import useTemplates from './useTemplates';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';

const NewTemplateSectionList = ({handleNewTemplatePressed}) => {
  /* Data Hooks */

  const {getNewTemplatesList, getTemplateTitle} = useTemplates();

  /* Derived Variables */

  const newTemplatesListSectioned = getNewTemplatesList();
  const newTemplatesListSectionedSorted = newTemplatesListSectioned.sort((a, b) => a.title.localeCompare(b.title));

  /* Render Functions */

  const renderTemplateListItem = ({item, section}) => {
    const title = getTemplateTitle(item);
    return (
      <TemplateListItem
        id={item}
        onPress={() => handleNewTemplatePressed(item, section)}
        title={title}
      />
    );
  };

  /* View */

  return (
    <SectionList
      ItemSeparatorComponent={FlatListItemSeparator}
      keyExtractor={(item, index) => item + index}
      renderItem={renderTemplateListItem}
      renderSectionHeader={props => <TemplateSectionHeader {...props}/>}
      sections={newTemplatesListSectionedSorted}
      stickySectionHeadersEnabled={true}
    />
  );
};

export default NewTemplateSectionList;
