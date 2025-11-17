import React from 'react';

import {ListItem} from '@rn-vui/base';

import commonStyles from '../../shared/common.styles';

const TemplateListItem = ({id, onPress, title}) => {

  return (
    <ListItem
      containerStyle={commonStyles.listItem}
      key={id}
      onPress={onPress}
    >
      <ListItem.Content>
        <ListItem.Title style={commonStyles.listItemTitle}>{title}</ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron/>
    </ListItem>
  );
};

export default TemplateListItem;
