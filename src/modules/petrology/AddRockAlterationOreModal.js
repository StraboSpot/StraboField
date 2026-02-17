import React from 'react';

import {ADD_ROCK_KEYS} from './petrology.constants';
import {Form, MainButtons} from '../form';

const {firstKeys, secondKeys, lastKeys} = ADD_ROCK_KEYS.alteration_ore;

const AddRockAlterationOreModal = ({formName, formProps, setChoicesViewKey, survey}) => {

  /* Derived Variables */

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
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={secondKeys}
        setChoicesViewKey={setChoicesViewKey}
      />
      <Form {...{surveyFragment: lastKeysFields, ...formProps}}/>
    </>
  );
};

export default AddRockAlterationOreModal;
