import React from 'react';

import {Form} from '../form';

const AddTensor = ({formName, formProps}) => {
  return (
    <Form {...formProps} formName={formName}/>
  );
};

export default AddTensor;
