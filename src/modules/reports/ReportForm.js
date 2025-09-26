import React, {forwardRef, useState} from 'react';
import {Text, View} from 'react-native';

import {Formik} from 'formik';

import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, useForm} from '../form';
import {PAGE_KEYS} from '../page/page.constants';

const ReportForm = forwardRef(({initialValues}, formRef) => {
  const {getChoices, getRelevantFields, getSurvey, validateForm} = useForm();

  const [choicesViewKey, setChoicesViewKey] = useState(null);

  const groupKey = 'general';
  const pageKey = PAGE_KEYS.REPORTS;
  const formName = [groupKey, pageKey];

  const survey = getSurvey(formName);

  const mainFormKeys = ['report_privacy', 'report_type', 'subject', 'notes'];
  const mainFormKeysFields = mainFormKeys.map(k => survey.find(f => f.name === k));

  const onMyChange = async (name, value) => {
    await formRef.current.setFieldValue(name, value);
    setChoicesViewKey(null);
  };

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
          formName: [groupKey, pageKey],
          surveyFragment: relevantFields, ...formProps,
          onMyChange: onMyChange,
        }}/>
      </ModalWrapper>
    );
  };

  return (
    <Formik
      initialValues={initialValues}
      innerRef={formRef}
      onSubmit={values => console.log('Submitting form...', values)}
      validate={values => validateForm({formName: formName, values: values})}
      validateOnChange={false}
    >
      {formProps => (
        <View style={{flex: 1}}>
          <Form {...{formName: formName, surveyFragment: mainFormKeysFields, ...formProps}}/>
          {choicesViewKey && renderSubform(formProps)}
        </View>
      )}
    </Formik>
  );
});

export default ReportForm;
