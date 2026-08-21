import React from 'react';

import {ADD_LINE_FIRST_KEYS, ADD_LINE_LAST_KEYS, ADD_LINE_MAIN_BUTTONS_KEYS} from './measurements.constants';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import {Form, MainButtons} from '../form';

const AddLine = ({formName, formProps, isManualMeasurement, isPlanarLinear, setChoicesViewKey, survey}) => {
  /* Derived Variables */

  let updatedFormProps = {...formProps};
  if (isPlanarLinear) {
    updatedFormProps = {
      ...formProps,
      values: (formProps.values.associated_orientation && formProps.values.associated_orientation[0]) || {},
    };
  }
  // Relevant fields for quick-entry modal
  const firstKeysFields = ADD_LINE_FIRST_KEYS.map(k => survey.find(f => f.name === k));
  const lastKeysFields = ADD_LINE_LAST_KEYS.map(k => survey.find(f => f.name === k));

  /* View */

  return (
    <>
      {!isManualMeasurement && !isPlanarLinear && (
        <Form {...updatedFormProps} formName={formName} surveyFragment={firstKeysFields}/>
      )}
      <MainButtons
        formName={formName}
        formProps={updatedFormProps}
        mainKeys={ADD_LINE_MAIN_BUTTONS_KEYS}
        setChoicesViewKey={setChoicesViewKey}
        subkey={isPlanarLinear && 'associated_orientation'}
      />
      <LittleSpacer/>
      <Form
        {...updatedFormProps}
        formName={formName}
        subkey={isPlanarLinear && 'associated_orientation'}
        surveyFragment={lastKeysFields}
      />
    </>
  );
};

export default AddLine;
