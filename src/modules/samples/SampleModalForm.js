import React from 'react';
import {View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {Formik} from 'formik';

import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR} from '../../shared/styles.constants';
import {Form, FormSlider, MainButtons, useForm} from '../form';
import {
  SAMPLE_FIRST_KEYS,
  SAMPLE_FORM_NAME,
  SAMPLE_INPLACENESS_KEY,
  SAMPLE_ORIENTED_KEY,
  SAMPLE_TYPE_KEY,
} from './samples.constants';

const SampleModalForm = ({choicesViewKey, formRef, namePostfix, namePrefix, setChoicesViewKey, startingNumber}) => {
  const {getChoices, getRelevantFields, getSurvey} = useForm();

  const choices = getChoices(SAMPLE_FORM_NAME);
  const survey = getSurvey(SAMPLE_FORM_NAME);
  const firstKeysFields = SAMPLE_FIRST_KEYS.map(k => survey.find(f => f.name === k));

  const getSelectedOrientedIndex = () => {
    const value = formRef.current?.values[SAMPLE_ORIENTED_KEY];
    if (value === 'yes') return 0;
    if (value === 'no') return 1;
    return undefined;
  };

  const onOrientedButtonPress = (i) => {
    const currentValue = formRef.current?.values[SAMPLE_ORIENTED_KEY];
    if (i === 0) formRef.current?.setFieldValue(SAMPLE_ORIENTED_KEY, currentValue === 'yes' ? undefined : 'yes');
    else formRef.current?.setFieldValue(SAMPLE_ORIENTED_KEY, currentValue === 'no' ? undefined : 'no');
  };

  const renderForm = formProps => (
    <>
      <MainButtons
        formName={SAMPLE_FORM_NAME}
        formProps={formProps}
        mainKeys={SAMPLE_TYPE_KEY}
        setChoicesViewKey={setChoicesViewKey}
      />
      <Form formName={SAMPLE_FORM_NAME} surveyFragment={firstKeysFields} {...formProps}/>
      <FormSlider
        choices={choices}
        fieldKey={SAMPLE_INPLACENESS_KEY}
        formProps={formProps}
        labels={['In Place', 'Float']}
        survey={survey}
      />
      <ButtonGroup
        buttonStyle={{padding: 5}}
        buttons={['Oriented', 'Unoriented']}
        containerStyle={{borderRadius: 10, height: 40}}
        onPress={onOrientedButtonPress}
        selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
        selectedIndex={getSelectedOrientedIndex()}
        textStyle={{color: PRIMARY_TEXT_COLOR}}
      />
    </>
  );

  const renderSubform = formProps => (
    <Form formName={SAMPLE_FORM_NAME} surveyFragment={getRelevantFields(survey, choicesViewKey)} {...formProps}/>
  );

  const formatNumber = num => num < 10 ? '0' + num : num;

  return (
    <Formik
      enableReinitialize
      initialValues={{
        inplaceness_of_sample: '5___definitely',
        material_type: 'intact_rock',
        sample_id_name: namePrefix + (namePostfix || formatNumber(startingNumber)),
        sample_type: 'individual_sample',
      }}
      innerRef={formRef}
      onSubmit={values => console.log('Submitting form...', values)}
    >
      {formProps => (
        <View style={{flex: 1}}>
          {choicesViewKey ? renderSubform(formProps) : renderForm(formProps)}
        </View>
      )}
    </Formik>
  );
};

export default SampleModalForm;
