import React from 'react';

import {ADD_FABRIC_KEYS, ADD_FABRIC_FIELDS} from './fabric.constants';
import {Form, MainButtons} from '../form';

const IgneousRockFabric = ({formName, formProps, setChoicesViewKey, survey}) => {

  const {firstKeys, lastKeys} = ADD_FABRIC_KEYS.igneous_rock;
  const firstKeysFields = firstKeys.map(k => survey.find(f => f.name === k));
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));
  const mainButtonsKeys = ADD_FABRIC_FIELDS.igneous_rock;

  return (
    <>
      <Form {...{formName: formName, surveyFragment: firstKeysFields, ...formProps}}/>
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={mainButtonsKeys}
        setChoicesViewKey={setChoicesViewKey}
      />
      <Form {...{formName: formName, surveyFragment: lastKeysFields, ...formProps}}/>
    </>
  );
};

export default IgneousRockFabric;
