import React from 'react';

import {ADD_ROCK_KEYS} from './petrology.constants';
import {Form, MainButtons} from '../form';

const {firstKeys, lastKeys} = ADD_ROCK_KEYS.fault;

const AddRockFaultModal = ({formName, formProps, setChoicesViewKey, survey}) => {
  /* Derived Variables */

  // Relevant fields for quick-entry modal
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));

  /* View */

  return (
    <>
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={firstKeys}
        setChoicesViewKey={setChoicesViewKey}
      />
      <Form {...formProps} surveyFragment={lastKeysFields}/>
    </>
  );
};

export default AddRockFaultModal;
