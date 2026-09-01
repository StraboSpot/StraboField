import React, {useEffect, useRef} from 'react';
import {Linking, Text, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/helpers';
import {Form, FormFlatList, FormikWrapper, useForm} from '../../form';
import {updatedProject} from '../projects.slice';

const formName = ['settings', 'project_settings'];

const ProjectPrivacy = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {owner_straboUserId} = useSelector(state => state.project.project);
  const preferences = useSelector(state => state.project.project?.preferences) || {};
  const {straboUserId} = useSelector(state => state.user);

  const {validateForm} = useForm();
  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);
  const hasSavedRef = useRef(false);

  /* Side Effects */

  // Whether a project is public has consequences worth confirming, and the change is written as it is made, so
  // confirm the visit once on the way out
  useEffect(() => {
    return () => {
      if (hasSavedRef.current) toast.show('Privacy Settings Saved', {type: 'success'});
    };
  }, []);

  /* Event Handlers */

  // This form writes on every change, so an invalid value must not reach the project. Formik's values lag a render
  // behind the field just changed, so validate the change on top of them, put what it finds under the field, and
  // save what validating cleans up rather than the text as typed. Alerting per keystroke would be unusable.
  const setFieldValueAndSavePreferences = async (name, value) => {
    await formRef.current.setFieldValue(name, value);
    const {errors, values: updatedValues} = validateForm({
      formName: formName,
      values: {...formRef.current.values, [name]: value},
    });
    formRef.current.setErrors(errors);
    if (!isEmpty(errors)) return;
    console.log('Saving privacy preferences to Project ...', updatedValues);
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
            isReadOnly={owner_straboUserId !== straboUserId}
            renderInline={true}
            setFieldValueOverride={setFieldValueAndSavePreferences}
          />
        )}
      </FormikWrapper>
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
