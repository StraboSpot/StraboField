import React from 'react';
import {SectionList} from 'react-native';

import {ListItem} from '@rn-vui/base';

import {getTemplateTitle} from './templates.helpers';
import commonStyles from '../../shared/common.styles';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';

// The main menu's lists of templates, saved ones or the kinds that can be made: sections titled by template key or
// type, of items with an id and a name
const TemplateSectionList = ({emptyText, onItemPressed, sections}) => {
  /* Render Functions */

  const renderItem = ({item, section}) => {
    return (
      <ListItem containerStyle={commonStyles.listItem} onPress={() => onItemPressed(item, section)}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{item.name}</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  /* View */

  return (
    <SectionList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={emptyText && <ListEmptyText text={emptyText}/>}
      keyExtractor={item => item.id.toString()}
      renderItem={renderItem}
      renderSectionHeader={({section}) => <SectionDivider dividerText={getTemplateTitle(section.title)}/>}
      sections={sections}
      stickySectionHeadersEnabled={true}
    />
  );
};

export default TemplateSectionList;
