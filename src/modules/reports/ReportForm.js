import React, {forwardRef, useState} from 'react';
import {Text, View} from 'react-native';

import {Formik} from 'formik';

import {REPORT_FORM_NAME, REPORT_MAIN_FORM_KEYS} from './reports.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, useForm} from '../form';

const ReportForm = forwardRef(({initialValues}, formRef) => {
  /* Data Hooks */
  const {getRelevantFields, getSurvey, validateForm} = useForm();

  /* Local State */

  const [choicesViewKey, setChoicesViewKey] = useState(null);

  /* Derived Variables */

  const survey = getSurvey(REPORT_FORM_NAME);

  const mainFormKeysFields = REPORT_MAIN_FORM_KEYS.map(k => survey.find(f => f.name === k));

  /* Event Handlers */

  const onMyChange = async (name, value) => {
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
        <Form {...{
          formName: REPORT_FORM_NAME,
          surveyFragment: relevantFields, ...formProps,
          onMyChange: onMyChange,
        }}/>
      </ModalWrapper>
    );
  };

  /* View */

  return (
    <Formik
      initialValues={initialValues}
      innerRef={formRef}
      onSubmit={values => console.log('Submitting form...', values)}
      validate={values => validateForm({formName: REPORT_FORM_NAME, values: values})}
      validateOnChange={false}
    >
      {formProps => (
        <View style={{flex: 1}}>
          <Form {...{formName: REPORT_FORM_NAME, surveyFragment: mainFormKeysFields, ...formProps}}/>
          {choicesViewKey && renderSubform(formProps)}
        </View>
      )}
    </Formik>
  );
});

export default ReportForm;
