import React from 'react';

import {ListItem} from '@rn-vui/base';

import {getFabricTitle} from './fabrics.helpers';
import commonStyles from '../../shared/common.styles';
import useForm from '../form/useForm';

const FabricListItem = ({
                          editFabric,
                          fabric,
                        }) => {
  /* Data Hooks */

  const {getLabel, getLabels} = useForm();

  /* View */

  return (
    <ListItem
      containerStyle={commonStyles.listItem}
      key={fabric.id}
      onPress={() => editFabric(fabric)}
    >
      <ListItem.Content style={{overflow: 'hidden'}}>
        <ListItem.Title style={commonStyles.listItemTitle}>
          {fabric.label || getFabricTitle(fabric, getLabel, getLabels)}
        </ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron/>
    </ListItem>
  );
};

export default FabricListItem;
