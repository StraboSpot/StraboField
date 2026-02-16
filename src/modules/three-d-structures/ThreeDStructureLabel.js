import React from 'react';
import {Text} from 'react-native';

import {toTitleCase} from '../../shared/Helpers';
import {useForm} from '../form';

const ThreeDStructureLabel = ({item}) => {
  /* Data Hooks / State */

  const {getLabel} = useForm();

  /* Logic Helpers */

  const getTitle = (threeDStructure) => {
    const firstClassTitle = toTitleCase(threeDStructure.type || '3D Structure');
    const secondClassTitle = getLabel(threeDStructure.feature_type || threeDStructure.fault_or_sz_type,
      ['_3d_structures', threeDStructure.type]).toUpperCase();
    return firstClassTitle + ' - ' + secondClassTitle;
  };

  /* View */

  return (
    <Text>{getTitle(item)}</Text>
  );
};
export default ThreeDStructureLabel;
