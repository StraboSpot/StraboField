import React, {useRef} from 'react';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {Form, useForm} from '../../form';
import {updatedProject} from '../../project/projects.slice';

const NamingConventions = () => {
  const dispatch = useDispatch();
  const formName = ['preferences', 'naming_conventions'];
  const {validateForm} = useForm();
  const formRef = useRef(null);
  const preferences = useSelector(state => state.project.project?.preferences) || {};

  const onMyChange = async (name, value) => {
    await formRef.current.setFieldValue(name, value);
    await formRef.current.submitForm();
    const updatedValues = {...formRef.current.values, [name]: value};
    console.log('Saving naming convention preferences to Project ...', updatedValues);
    dispatch(updatedProject({field: 'preferences', value: updatedValues}));
  };

  return (
    <Formik
      innerRef={formRef}
      onSubmit={values => console.log('Submitting form...', values)}
      validate={values => validateForm({formName: formName, values: values})}
      initialValues={preferences}
      validateOnChange={false}
      enableReinitialize={true}  // Update values if preferences change while form open, like when number incremented
    >
      {formProps => <Form {...{...formProps, formName: formName, onMyChange: onMyChange, setFieldValue: onMyChange}}/>}
    </Formik>
  );
};

export default NamingConventions;
