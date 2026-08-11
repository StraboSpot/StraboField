import React, {useRef} from 'react';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {FormFlatList} from '../../shared/ui';
import {Form, useForm} from '../form';
import {updatedProject} from './projects.slice';

const formName = ['settings', 'naming_conventions'];

const NamingConventions = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const preferences = useSelector(state => state.project.project?.preferences) || {};

  const {validateForm} = useForm();

  /* Local State */

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

  // FormFlatList is the single scroll container, so Form renders its fields inline rather than in its own list.
  return (
    <FormFlatList>
      <Formik
        enableReinitialize={true}  // Update values if preferences change while form open, like when number incremented
        initialValues={preferences}
        innerRef={formRef}
        onSubmit={values => console.log('Submitting form...', values)}
        validate={values => validateForm({formName: formName, values: values})}
        validateOnChange={false}
      >
        {formProps => (
          <Form {...{
            ...formProps,
            formName: formName,
            onMyChange: onMyChange,
            renderInline: true,
            setFieldValue: onMyChange,
          }}/>
        )}
      </Formik>
    </FormFlatList>
  );
};

export default NamingConventions;
