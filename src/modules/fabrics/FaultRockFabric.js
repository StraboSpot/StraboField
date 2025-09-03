import React from 'react';

import {FIRST_ORDER_FABRIC_FIELDS} from './fabric.constants';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import {Form, FormSlider, MainButtons} from '../form';

const FaultRockFabric = ({choices, formName, formProps, setChoicesViewKey, survey}) => {

  // Relevant keys for quick-entry modal
  const firstKeys = ['label'];
  const mainButtonsKeys = FIRST_ORDER_FABRIC_FIELDS.fault_rock;
  const lastKeys = ['interp_note'];
  const tectoniteTypesKey = 'tectonite_type';

  // Relevant fields for quick-entry modal
  const firstKeysFields = firstKeys.map(k => survey.find(f => f.name === k));
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));

  return (
    <>
      <Form {...{formName: formName, surveyFragment: firstKeysFields, ...formProps}}/>
      <LittleSpacer/>
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={mainButtonsKeys}
        setChoicesViewKey={setChoicesViewKey}
      />
      <LittleSpacer/>
      <Form {...{formName: formName, surveyFragment: lastKeysFields, ...formProps}}/>
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

export default FaultRockFabric;
