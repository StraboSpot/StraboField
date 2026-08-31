import React from 'react';

import {ADD_FABRIC_KEYS, ADD_FABRIC_FIELDS} from './fabric.constants';
import {Form, FormSlider, MainButtons} from '../form';

const {firstKeys, lastKeys, tectoniteTypesKey} = ADD_FABRIC_KEYS.metamorphic_rock;
const mainButtonsKeys = ADD_FABRIC_FIELDS.metamorphic_rock;

const MetamorphicFabric = ({choices, formName, formProps, setChoicesViewKey, survey}) => {
  /* Derived Variables */

  const firstKeysFields = firstKeys.map(k => survey.find(f => f.name === k));
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));

  /* View */

  return (
    <>
      <Form {...formProps} formName={formName} surveyFragment={firstKeysFields}/>
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={mainButtonsKeys}
        setChoicesViewKey={setChoicesViewKey}
      />
      <Form {...formProps} formName={formName} surveyFragment={lastKeysFields}/>
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

export default MetamorphicFabric;
