import React, {useLayoutEffect, useRef} from 'react';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {PROJECT_DESCRIPTION_FORM_NAME} from './project.constants';
import {updatedProject} from './projects.slice';
import alert from '../../shared/ui/alert';
import {Form, FormFlatList, FormikWrapper, useForm} from '../form';

let timeout;

const ProjectDescription = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const project = useSelector(state => state.project.project);

  const {getLabel, hasErrors, validateForm} = useForm();
  const toast = useToast();

  /* Local State */

  const descriptionFormRef = useRef(null);
  const hasSavedRef = useRef(false);

  /* Derived Variables */

  const projectDescription = {
    ...project.description,
    gps_datum: project.description?.gps_datum || 'WGS84 (Default)',
    magnetic_declination: project.description?.magnetic_declination || 0,
  };

  /* Side Effects */

  useLayoutEffect(() => {
    // The pending save would fire against a form that no longer exists, and doCleanup saves what it was waiting on
    return () => {
      clearTimeout(timeout);
      doCleanup();
    };
  }, []);

  /* Event Handlers */

  const setFieldValueAndSaveAfterPause = async (name, value) => {
    await descriptionFormRef.current.setFieldValue(name, value);
    console.log('updated field value');

    // Wait 2000 milliseconds (2 seconds) from last change before saving
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(async () => {
      if (!hasErrors(descriptionFormRef.current)) await saveForm(descriptionFormRef.current);
    }, 2000);
  };

  /* Logic Helpers */

  // Every change is written as it is made, so confirm the visit once on the way out rather than field by field
  const doCleanup = async () => {
    if (hasErrors(descriptionFormRef.current)) showErrors(descriptionFormRef.current);
    else if (descriptionFormRef.current?.dirty) await saveForm(descriptionFormRef.current);
    if (hasSavedRef.current) toast.show('Project Description Saved', {type: 'success'});
  };

  // Save what validating cleans up - the magnetic declination as a number, not as the text it was typed in as
  const saveForm = async (descriptionCurrent) => {
    await descriptionCurrent.submitForm();
    const {values: updatedValues} = validateForm({
      formName: PROJECT_DESCRIPTION_FORM_NAME,
      values: descriptionCurrent.values,
    });
    console.log('Saving project description to Project ...', updatedValues);
    dispatch(updatedProject({field: 'description', value: updatedValues}));
    hasSavedRef.current = true;
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
      <FormikWrapper
        enableReinitialize={true}
        formName={PROJECT_DESCRIPTION_FORM_NAME}
        initialValues={projectDescription}
        innerRef={descriptionFormRef}
      >
        {formProps => (
          <Form
            {...formProps}
            formName={PROJECT_DESCRIPTION_FORM_NAME}
            renderInline={true}
            setFieldValueOverride={setFieldValueAndSaveAfterPause}
          />
        )}
      </FormikWrapper>
    </FormFlatList>
  );
};

export default ProjectDescription;
