import React, {useRef} from 'react';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {updatedProject} from './projects.slice';
import {isEmpty} from '../../shared/helpers';
import {FormFlatList} from '../../shared/ui';
import {Form, useForm} from '../form';

const formName = ['settings', 'naming_conventions'];

const NamingConventions = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const preferences = useSelector(state => state.project.project?.preferences) || {};

  const {validateForm} = useForm();

  /* Local State */

  const formRef = useRef(null);

  /* Event Handlers */

  // This form writes on every change, so an invalid value must not reach the project. Ask Formik to validate
  // rather than reading form.errors, which lags a render behind, and skip the write while anything is invalid.
  // The field shows its own error inline, so nothing needs alerting — and alerting per keystroke would be unusable.
  const onMyChange = async (name, value) => {
    await formRef.current.setFieldValue(name, value);
    const errors = await formRef.current.validateForm();
    if (!isEmpty(errors)) return;
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
          <Form
            {...formProps}
            formName={formName}
            onMyChange={onMyChange}
            renderInline={true}
            setFieldValue={onMyChange}
          />
        )}
      </Formik>
    </FormFlatList>
  );
};

export default NamingConventions;
