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
  /* Data Hooks */

  const {getChoices, getRelevantFields, getSurvey} = useForm();

  /* Derived Variables */

  const choices = getChoices(SAMPLE_FORM_NAME);
  const survey = getSurvey(SAMPLE_FORM_NAME);
  const firstKeysFields = SAMPLE_FIRST_KEYS.map(k => survey.find(f => f.name === k));

  /* Event Handlers */

  const onOrientedButtonPress = (i) => {
    const currentValue = formRef.current?.values[SAMPLE_ORIENTED_KEY];
    if (i === 0) formRef.current?.setFieldValue(SAMPLE_ORIENTED_KEY, currentValue === 'yes' ? undefined : 'yes');
    else formRef.current?.setFieldValue(SAMPLE_ORIENTED_KEY, currentValue === 'no' ? undefined : 'no');
  };

  /* Logic Helpers */

  const formatNumber = num => num < 10 ? '0' + num : num;

  const getSelectedOrientedIndex = () => {
    const value = formRef.current?.values[SAMPLE_ORIENTED_KEY];
    if (value === 'yes') return 0;
    if (value === 'no') return 1;
    return undefined;
  };

  /* Render Functions */

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

  /* View */

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
        // No flex here: this sits in the modal's scrolling body alongside the images and geologic units
        // sections, so it must size to its content. `flex: 1` collapses it to the leftover space and its
        // fields overflow onto the sections below.
        <View>
          {choicesViewKey ? renderSubform(formProps) : renderForm(formProps)}
        </View>
      )}
    </Formik>
  );
};

export default SampleModalForm;
