import React, {forwardRef, useState} from 'react';
import {View} from 'react-native';

import {Button, Overlay} from '@rn-vui/base';
import {Formik} from 'formik';

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

  const mainFormKeys = ['report_privacy', 'report_type', 'subject', 'notes'];
  const mainFormKeysFields = mainFormKeys.map(k => survey.find(f => f.name === k));

  const onMyChange = async (name, value) => {
    await formRef.current.setFieldValue(name, value);
    setChoicesViewKey(null);
  };

  const renderSubform = (formProps) => {
    const relevantFields = getRelevantFields(survey, choicesViewKey);
    return (
      <Overlay
        overlayStyle={overlayStyles.overlayContainer}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={{alignItems: 'flex-end'}}>
          <Button
            buttonStyle={{padding: 0}}
            icon={{name: 'close', type: 'ionicon', size: 20}}
            onPress={() => setChoicesViewKey(null)}
            type={'clear'}
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
