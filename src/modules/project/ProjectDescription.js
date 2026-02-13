import React, {useLayoutEffect, useRef} from 'react';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {updatedProject} from './projects.slice';
import alert from '../../shared/ui/alert';
import {Form, useForm} from '../form';

const ProjectDescription = () => {
  const dispatch = useDispatch();
  const project = useSelector(state => state.project.project);

  const {getLabel, hasErrors, validateForm} = useForm();

  const descriptionFormRef = useRef(null);
  let timeout;

  const formName = ['general', 'project_description'];
  const projectDescription = {
    ...project.description,
    gps_datum: project.description?.gps_datum || 'WGS84 (Default)',
    magnetic_declination: project.description?.magnetic_declination || 0,
  };

  useLayoutEffect(() => {
    return () => doCleanup();
  }, []);

  const doCleanup = () => {
    if (hasErrors(descriptionFormRef.current)) showErrors(descriptionFormRef.current);
    else if (descriptionFormRef.current?.dirty) saveForm(descriptionFormRef.current);
  };

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

  const saveForm = async (descriptionCurrent) => {
    await descriptionCurrent.submitForm();
    console.log('Saving project daily-notes to Project ...', descriptionCurrent.values);
    dispatch(updatedProject({field: 'description', value: descriptionCurrent.values}));
  };

  const showErrors = (descriptionCurrent) => {
    const errorMessages = Object.entries(descriptionCurrent.errors).map(([key, value]) => (
      getLabel(key, formName) + ': ' + value
    ));
    alert('Project Description Errors!', 'Changes in the following fields were not saved.'
      + ' Please fix the errors:\n\n' + errorMessages.join('\n'));
  };

  return (
    <Formik
      component={formProps => Form(
        {...formProps, formName: formName, onMyChange: onMyChange, setFieldValue: onMyChange})}
      enableReinitialize={true}
      initialValues={projectDescription}
      innerRef={descriptionFormRef}
      onSubmit={values => console.log('Submitting form...', values)}
      validate={values => validateForm({formName: formName, values: values})}
      validateOnChange={true}
    />
  );
};

export default ProjectDescription;
