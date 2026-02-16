import React, {useRef} from 'react';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {Form, useForm} from '../form';
import {updatedProject} from './projects.slice';

const formName = ['settings', 'naming_conventions'];

const NamingConventions = () => {
  /* Data Hooks / State */

  const dispatch = useDispatch();

  const preferences = useSelector(state => state.project.project?.preferences) || {};

  const {validateForm} = useForm();

  const formRef = useRef(null);

  /* Event Handlers */

  const onMyChange = async (name, value) => {
    await formRef.current.setFieldValue(name, value);
    await formRef.current.submitForm();
    const updatedValues = {...formRef.current.values, [name]: value};
    console.log('Saving naming convention preferences to Project ...', updatedValues);
    dispatch(updatedProject({field: 'preferences', value: updatedValues}));
  };

  /* View */

  return (
    <Formik
      enableReinitialize={true}  // Update values if preferences change while form open, like when number incremented
      initialValues={preferences}
      innerRef={formRef}
      onSubmit={values => console.log('Submitting form...', values)}
      validate={values => validateForm({formName: formName, values: values})}
      validateOnChange={false}
    >
      {formProps => <Form {...{...formProps, formName: formName, onMyChange: onMyChange, setFieldValue: onMyChange}}/>}
    </Formik>
  );
};

export default NamingConventions;
