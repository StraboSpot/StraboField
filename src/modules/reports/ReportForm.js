import React, {forwardRef, useState} from 'react';
import {View} from 'react-native';

import {Formik} from 'formik';
import {Button, Overlay} from 'react-native-elements';

import {Form, useForm} from '../form';
import overlayStyles from '../home/overlays/overlay.styles';
import {PAGE_KEYS} from '../page/page.constants';

const ReportForm = forwardRef(({initialValues}, formRef) => {
  const {getChoices, getRelevantFields, getSurvey, validateForm} = useForm();

  const [choicesViewKey, setChoicesViewKey] = useState(null);

  const groupKey = 'general';
  const pageKey = PAGE_KEYS.REPORTS;
  const formName = [groupKey, pageKey];

  const survey = getSurvey(formName);
  const choices = getChoices(formName);

  const mainFormKeys = ['report_privacy', 'report_type', 'subject', 'notes'];
  const mainFormKeysFields = mainFormKeys.map(k => survey.find(f => f.name === k));

  const onMyChange = async (name, value) => {
    await formRef.current.setFieldValue(name, value);
    setChoicesViewKey(null);
  };

  const renderSubform = (formProps) => {
    const relevantFields = getRelevantFields(survey, choicesViewKey);
    return (
      <Overlay overlayStyle={overlayStyles.overlayContainer}>
        <View style={{alignItems: 'flex-end'}}>
          <Button
            onPress={() => setChoicesViewKey(null)}
            type={'clear'}
            icon={{name: 'close', type: 'ionicon', size: 20}}
            buttonStyle={{padding: 0}}
          />
        </View>
        <Form {...{
          formName: [groupKey, pageKey],
          surveyFragment: relevantFields, ...formProps,
          onMyChange: onMyChange,
        }}/>
      </Overlay>
    );
  };

  return (
    <Formik
      innerRef={formRef}
      initialValues={initialValues}
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
