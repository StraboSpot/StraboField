import React, {forwardRef, useState} from 'react';
import {Text, View} from 'react-native';

import {REPORT_FORM_NAME, REPORT_MAIN_FORM_KEYS} from './reports.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, FormikWrapper, useForm} from '../form';

const ReportForm = forwardRef(({initialValues, setIsFormInvalid}, formRef) => {
  /* Data Hooks */
  const {getRelevantFields, getSurvey} = useForm();

  /* Local State */

  const [choicesViewKey, setChoicesViewKey] = useState(null);

  /* Derived Variables */

  const survey = getSurvey(REPORT_FORM_NAME);

  const mainFormKeysFields = REPORT_MAIN_FORM_KEYS.map(k => survey.find(f => f.name === k));

  /* Event Handlers */

  const setFieldValueAndCloseChoices = async (name, value) => {
    await formRef.current.setFieldValue(name, value);
    setChoicesViewKey(null);
  };

  /* Render Functions */

  const renderSubform = (formProps) => {
    const relevantFields = getRelevantFields(survey, choicesViewKey);
    return (
      <ModalWrapper
        actionTitle={'[Action]'}
        headerTitle={'[Subform]'}
        onActionPressed={() => setChoicesViewKey(null)}
        onCancelPress={() => setChoicesViewKey(null)}
      >
        <Text style={{textAlign: 'center'}}>This is a placeholder for the subform</Text>
        <Form
          {...formProps}
          formName={REPORT_FORM_NAME}
          setFieldValueOverride={setFieldValueAndCloseChoices}
          surveyFragment={relevantFields}
        />
      </ModalWrapper>
    );
  };

  /* View */

  return (
    <FormikWrapper
      formName={REPORT_FORM_NAME}
      initialValues={initialValues}
      innerRef={formRef}
      setIsFormInvalid={setIsFormInvalid}
    >
      {formProps => (
        <View style={{flex: 1}}>
          <Form {...formProps} formName={REPORT_FORM_NAME} surveyFragment={mainFormKeysFields}/>
          {choicesViewKey && renderSubform(formProps)}
        </View>
      )}
    </FormikWrapper>
  );
});

export default ReportForm;
