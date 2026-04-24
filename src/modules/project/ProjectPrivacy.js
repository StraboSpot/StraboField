import React, {useRef} from 'react';
import {Text, View} from 'react-native';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {Form, useForm} from '../form';
import {updatedProject} from './projects.slice';
import commonStyles from '../../shared/common.styles';

const formName = ['settings', 'project_settings'];

const ProjectPrivacy = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project.project);
  const preferences = useSelector(state => state.project.project?.preferences) || {};

  const {validateForm} = useForm();

  /* Local State */

  const formRef = useRef(null);

  /* Event Handlers */

  const onMyChange = async (name, value) => {
    await formRef.current.setFieldValue(name, value);
    await formRef.current.submitForm();
    const updatedValues = {...formRef.current.values, [name]: value};
    console.log('Saving privacy preferences to Project ...', updatedValues);
    dispatch(updatedProject({field: 'preferences', value: updatedValues}));
  };

  /* View */

  return (
    <>
      <Formik
        enableReinitialize={true}  // Update values if preferences change while form open, like when number incremented
        initialValues={preferences}
        innerRef={formRef}
        onSubmit={values => console.log('Submitting form...', values)}
        validate={values => validateForm({formName: formName, values: values})}
        validateOnChange={false}
      >
        {formProps => <Form {...{
          ...formProps,
          formName: formName,
          onMyChange: onMyChange,
          setFieldValue: onMyChange,
          isReadOnly: isReadOnlyProject,
        }}/>}
      </Formik>
      <View style={{justifyContent: 'flex-start', alignItems: 'center', padding: 10}}>
        <Text style={commonStyles.standardDescriptionText}>
          *Public datasets are accessible at StraboSpot.org/search. Privacy settings are reversible and update when
          project is uploaded.
        </Text>
      </View>
    </>
  );
};

export default ProjectPrivacy;
