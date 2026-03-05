import React from 'react';

import {ListItem} from '@rn-vui/base';

import {ADD_FABRIC_FIELDS, DEFAULT_FABRIC_TYPE, DEPRECATED_FABRIC_TYPE} from './fabric.constants';
import commonStyles from '../../shared/common.styles';
import {isEmpty, toTitleCase} from '../../shared/Helpers';
import {useForm} from '../form';

const FabricListItem = ({
                          editFabric,
                          fabric,
                        }) => {
  /* Data Hooks */

  const {getLabel, getLabels} = useForm();

  /* Logic Helpers */

  const getTitle = (fabricObj) => {
    const {type} = fabricObj;
    if (type === DEPRECATED_FABRIC_TYPE) {
      return fabricObj.feature_type
        ? toTitleCase(getLabel(fabricObj.feature_type, ['_3d_structures', DEPRECATED_FABRIC_TYPE]))
        : 'Fabric';
    }
    const surveyPath = ['fabrics', type];
    const labelsArr = ADD_FABRIC_FIELDS[type]?.reduce((acc, fieldName) => {
      if (!fabricObj[fieldName]) return acc;
      const mainLabel = getLabel(fieldName, surveyPath);
      const choiceLabels = getLabels(fabricObj[fieldName], surveyPath);
      return [...acc, toTitleCase(mainLabel) + ' - ' + choiceLabels.toUpperCase()];
    }, []);
    if (isEmpty(labelsArr)) {
      return type === DEFAULT_FABRIC_TYPE ? 'Structural Fabric' : toTitleCase(getLabel(type, surveyPath));
    }
    return labelsArr.join(', ');
  };

  /* View */

  return (
    <ListItem
      containerStyle={commonStyles.listItem}
      key={fabric.id}
      onPress={() => editFabric(fabric)}
    >
      <ListItem.Content style={{overflow: 'hidden'}}>
        <ListItem.Title style={commonStyles.listItemTitle}>{getTitle(fabric)}</ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron/>
    </ListItem>
  );
};

export default FabricListItem;
