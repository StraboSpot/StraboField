import React from 'react';

import {ADD_FABRIC_KEYS, ADD_FABRIC_FIELDS} from './fabric.constants';
import {Form, FormSlider, MainButtons} from '../form';

const MetamRockFabric = ({choices, formName, formProps, setChoicesViewKey, survey}) => {

  const {firstKeys, lastKeys, tectoniteTypesKey} = ADD_FABRIC_KEYS.metamorphic_rock;
  const mainButtonsKeys = ADD_FABRIC_FIELDS.metamorphic_rock;
  const firstKeysFields = firstKeys.map(k => survey.find(f => f.name === k));
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));

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

export default MetamRockFabric;
