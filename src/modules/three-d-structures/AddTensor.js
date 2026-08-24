import React from 'react';

import {THREE_D_STRUCTURE_ORIENTATION_FIELDS} from './threeDStructures.constants';
import {onOrientationChange} from '../compass/compass.helpers';
import {Form} from '../form';

const AddTensor = ({formName, formProps}) => {
  /* Event Handlers */

  // Entering a strike fills in the dip direction and the reverse
  const onNumberChange = (name, value) => onOrientationChange(formProps, name, value,
    {orientationFields: THREE_D_STRUCTURE_ORIENTATION_FIELDS});

  /* View */

  return (
    <Form {...formProps} formName={formName} onNumberChange={onNumberChange}/>
  );
};

export default AddTensor;
