import React from 'react';

import {ADD_FABRIC_KEYS, ADD_FABRIC_FIELDS} from './fabric.constants';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import {Form, FormSlider, MainButtons} from '../form';

const {firstKeys, lastKeys, tectoniteTypesKey} = ADD_FABRIC_KEYS.fault_rock;
const mainButtonsKeys = ADD_FABRIC_FIELDS.fault_rock;

const StructuralFabric = ({choices, formName, formProps, setChoicesViewKey, survey}) => {
  /* Derived Variables */

  const firstKeysFields = firstKeys.map(k => survey.find(f => f.name === k));
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));

  /* View */

  return (
    <>
      <Form {...formProps} formName={formName} surveyFragment={firstKeysFields}/>
      <LittleSpacer/>
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={mainButtonsKeys}
        setChoicesViewKey={setChoicesViewKey}
      />
      <LittleSpacer/>
      <Form {...formProps} formName={formName} surveyFragment={lastKeysFields}/>
      <LittleSpacer/>
      <FormSlider
        choices={choices}
        fieldKey={tectoniteTypesKey}
        formProps={formProps}
        hasNoneChoice={true}
        hasRotatedLabels={true}
        survey={survey}
      />
    </>
  );
};

export default StructuralFabric;
