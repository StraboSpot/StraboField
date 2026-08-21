import React, {useRef} from 'react';
import {Linking, Text, View} from 'react-native';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {FormFlatList} from '../../../shared/ui';
import {Form, useForm} from '../../form';
import {updatedProject} from '../projects.slice';

const formName = ['settings', 'project_settings'];

const ProjectPrivacy = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {owner_straboUserId} = useSelector(state => state.project.project);
  const preferences = useSelector(state => state.project.project?.preferences) || {};
  const {straboUserId} = useSelector(state => state.user);

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
        {formProps => <Form {...{
          ...formProps,
          formName: formName,
          onMyChange: onMyChange,
          renderInline: true,
          setFieldValue: onMyChange,
          isReadOnly: owner_straboUserId !== straboUserId,
        }}/>}
      </Formik>
      <View style={{justifyContent: 'flex-start', alignItems: 'center', padding: 10}}>
        <Text style={commonStyles.standardDescriptionText}>
          {'Public datasets are accessible at '}
          <Text
            onPress={() => Linking.openURL('https://strabospot.org/search/')}
            style={{textDecorationLine: 'underline'}}>
            {'strabospot.org/search'}
          </Text>
          {'. Privacy settings are reversible and update when project is uploaded.\n\n* A public project does not mean '
            + 'the project is editable by everyone. To make a project ediable to others besides yourself it must be '
            + 'shared as a collaborative project. See the next section.'}
        </Text>
      </View>
    </FormFlatList>
  );
};

export default ProjectPrivacy;
