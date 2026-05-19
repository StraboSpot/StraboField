import React, {forwardRef} from 'react';
import {View} from 'react-native';

import {Formik} from 'formik';

import {REPORT_FORM_NAME, REPORT_MAIN_FORM_KEYS} from './reports.constants';
import {Form, useForm} from '../form';

const ReportForm = forwardRef(({initialValues, isReadOnly}, formRef) => {
  /* Data Hooks */
  const {getSurvey, validateForm} = useForm();

  /* Derived Variables */

  const survey = getSurvey(REPORT_FORM_NAME);

  const mainFormKeysFields = REPORT_MAIN_FORM_KEYS.map(k => survey.find(f => f.name === k));

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
          <Form {...{formName: REPORT_FORM_NAME, isReadOnly: isReadOnly, surveyFragment: mainFormKeysFields, ...formProps}}/>
        </View>
      )}
    </Formik>
  );
});

export default ReportForm;
