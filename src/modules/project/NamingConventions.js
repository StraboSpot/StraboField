import React, {useEffect, useRef} from 'react';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {updatedProject} from './projects.slice';
import {isEmpty} from '../../shared/helpers';
import {FormFlatList} from '../../shared/ui';
import {Form, FormikWrapper, useForm} from '../form';

const formName = ['settings', 'naming_conventions'];

const NamingConventions = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const preferences = useSelector(state => state.project.project?.preferences) || {};

  const {validateForm} = useForm();
  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);
  const hasSavedRef = useRef(false);

  /* Side Effects */

  // Every change is written as it is made, so confirm the visit once on the way out rather than field by field
  useEffect(() => {
    return () => {
      if (hasSavedRef.current) toast.show('Naming Conventions Saved', {type: 'success'});
    };
  }, []);

  /* Event Handlers */

  // This form writes on every change, so an invalid value must not reach the project. Formik's values lag a render
  // behind the field just changed, so validate the change on top of them, put what it finds under the field, and
  // save what validating cleans up rather than the text as typed. Alerting per keystroke would be unusable.
  const onMyChange = async (name, value) => {
    await formRef.current.setFieldValue(name, value);
    const {errors, values: updatedValues} = validateForm({
      formName: formName,
      values: {...formRef.current.values, [name]: value},
    });
    formRef.current.setErrors(errors);
    if (!isEmpty(errors)) return;
    console.log('Saving naming convention preferences to Project ...', updatedValues);
    dispatch(updatedProject({field: 'preferences', value: updatedValues}));
    hasSavedRef.current = true;
  };

  /* View */

  // FormFlatList is the single scroll container, so Form renders its fields inline rather than in its own list.
  return (
    <FormFlatList>
      <FormikWrapper
        enableReinitialize={true}  // Update values if preferences change while form open, like when number incremented
        formName={formName}
        initialValues={preferences}
        innerRef={formRef}
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
      </FormikWrapper>
    </FormFlatList>
  );
};

export default NamingConventions;
