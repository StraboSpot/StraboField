import React from 'react';
import {Text} from 'react-native';

import {getThreeDStructureTitle} from './threeDStructures.helpers';
import useForm from '../form/useForm';

const ThreeDStructureLabel = ({item}) => {
  /* Data Hooks */

  const {getLabel} = useForm();

  /* View */

  return (
    <Text>{item.label || getThreeDStructureTitle(item, getLabel)}</Text>
  );
};
export default ThreeDStructureLabel;
