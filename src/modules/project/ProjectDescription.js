import React, {useLayoutEffect, useRef} from 'react';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {PROJECT_DESCRIPTION_FORM_NAME} from './project.constants';
import {updatedProject} from './projects.slice';
import {FormFlatList} from '../../shared/ui';
import alert from '../../shared/ui/alert';
import {Form, useForm} from '../form';

let timeout;

const ProjectDescription = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const project = useSelector(state => state.project.project);

  const {getLabel, hasErrors, validateForm} = useForm();

  /* Local State */

  const descriptionFormRef = useRef(null);

  /* Derived Variables */

  const projectDescription = {
    ...project.description,
    gps_datum: project.description?.gps_datum || 'WGS84 (Default)',
    magnetic_declination: project.description?.magnetic_declination || 0,
  };

  /* Side Effects */

  useLayoutEffect(() => {
    return () => doCleanup();
  }, []);

  /* Event Handlers */

  const onMyChange = async (name, value) => {
    await descriptionFormRef.current.setFieldValue(name, value);
    console.log('updated field value');

    // Wait 2000 milliseconds (2 seconds) from last change before saving
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(async () => {
      const updatedValues = {...descriptionFormRef.current.values, [name]: value};
      if (!hasErrors(descriptionFormRef.current)) await saveForm(descriptionFormRef.current, updatedValues);
    }, 2000);
  };

  /* Logic Helpers */

  const doCleanup = () => {
    if (hasErrors(descriptionFormRef.current)) showErrors(descriptionFormRef.current);
    else if (descriptionFormRef.current?.dirty) saveForm(descriptionFormRef.current);
  };

  const saveForm = async (descriptionCurrent) => {
    await descriptionCurrent.submitForm();
    console.log('Saving project daily-notes to Project ...', descriptionCurrent.values);
    dispatch(updatedProject({field: 'description', value: descriptionCurrent.values}));
  };

  const showErrors = (descriptionCurrent) => {
    const errorMessages = Object.entries(descriptionCurrent.errors).map(([key, value]) => (
      getLabel(key, PROJECT_DESCRIPTION_FORM_NAME) + ': ' + value
    ));
    alert('Project Description Errors!', 'Changes in the following fields were not saved.'
      + ' Please fix the errors:\n\n' + errorMessages.join('\n'));
  };

  /* View */

  // FormFlatList is the single scroll container, so Form renders its fields inline rather than in its own list.
  return (
    <FormFlatList>
      <Formik
        enableReinitialize={true}
        initialValues={projectDescription}
        innerRef={descriptionFormRef}
        onSubmit={values => console.log('Submitting form...', values)}
        validate={values => validateForm({formName: PROJECT_DESCRIPTION_FORM_NAME, values: values})}
        validateOnChange={true}
      >
        {formProps => (
          <Form
            {...formProps}
            formName={PROJECT_DESCRIPTION_FORM_NAME}
            onMyChange={onMyChange}
            renderInline={true}
            setFieldValue={onMyChange}
          />
        )}
      </Formik>
    </FormFlatList>
  );
};

export default ProjectDescription;
