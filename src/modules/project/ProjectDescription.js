import React, {useRef, useState} from 'react';
import {FlatList, Switch, Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Formik} from 'formik';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import DailyNotesSection from './description/DailyNotesSection';
import {updatedProject} from './projects.slice';
import commonStyles from '../../shared/common.styles';
import {isEqual} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import SectionDivider from '../../shared/ui/SectionDivider';
import {Form, useForm} from '../form';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';

const ProjectDescription = () => {
  const dispatch = useDispatch();
  const project = useSelector(state => state.project.project);

  const {getLabel, hasErrors, validateForm} = useForm();
  const toast = useToast();

  const descriptionFormRef = useRef(null);
  const preferencesFormRef = useRef(null);

  const formName = ['general', 'project_description'];
  const projectDescription = {
    ...project.description,
    gps_datum: project.description?.gps_datum || 'WGS84 (Default)',
    magnetic_declination: project.description?.magnetic_declination || 0,
  };

  const initialPageData = project.preferences && project.preferences.hasOwnProperty('public')
    ? {public: project.preferences.public, ...projectDescription}
    : projectDescription;
  const [pageData, setPageData] = useState(initialPageData);

  const handleBackPressed = async () => {
    if (isPageDataChanged) {
      await saveForm();
      toast.show('Changes Saved!', 'success');
    }
    dispatch(setSidePanelVisible({bool: false}));
  };

  const isPageDataChanged = !isEqual(pageData, initialPageData);

  const saveForm = async () => {
    const descriptionCurrent = descriptionFormRef.current;
    const preferencesCurrent = preferencesFormRef.current;
    if (descriptionCurrent.dirty) {
      await descriptionCurrent.submitForm();
      let newDescriptionValues = JSON.parse(JSON.stringify(descriptionCurrent.values));
      if (hasErrors(descriptionCurrent)) {
        const errorMessages = Object.entries(descriptionCurrent.errors).map(([key, value]) => (
          getLabel(key, formName) + ': ' + value
        ));
        alert('Project Description Errors!', 'Changes in the following fields were not saved.'
          + ' Please fix the errors:\n\n' + errorMessages.join('\n'));
        const newValuesWithoutErrors = Object.keys(descriptionCurrent.values).reduce((acc, key) => {
          return Object.keys(descriptionCurrent.errors).includes(key) ? acc
            : {...acc, [key]: descriptionCurrent.values[key]};
        }, {});
        const erroredFieldsInitialValues = Object.keys(projectDescription).reduce((acc, key) => {
          return Object.keys(descriptionCurrent.errors).includes(key) ? {...acc, [key]: projectDescription[key]} : acc;
        }, {});
        newDescriptionValues = {...newValuesWithoutErrors, ...erroredFieldsInitialValues};
      }
      console.log('Saving project description to Project ...', newDescriptionValues);
      dispatch(updatedProject({field: 'description', value: newDescriptionValues}));
    }
    if (preferencesCurrent.dirty) {
      console.log('Saving Project Preferences', preferencesCurrent.values);
      await preferencesCurrent.submitForm();
      dispatch(updatedProject({field: 'preferences', value: preferencesCurrent.values}));
    }
  };

  return (
    <>
      <SidePanelHeader
        title={isPageDataChanged ? 'Active Project (Save Changes)' : 'Active Project'}
        headerTitle={'Project Description'}
        backButton={handleBackPressed}
      />
      <View style={{flex: 1.5}}>
        <FlatList
          ListHeaderComponent={
            <Formik
              innerRef={descriptionFormRef}
              onSubmit={values => console.log('Submitting form...', values)}
              validate={(values) => {
                validateForm({formName: formName, values: values});
                setPageData(d => ({...d, ...values}));
              }}
              component={formProps => Form({formName: formName, ...formProps})}
              initialValues={projectDescription}
              validateOnChange={true}
              enableReinitialize={true}  // Update values if preferences change while form open, like when number incremented
            />
          }
        />
      </View>
      <View style={{flex: 1}}>
        <FlatList
          ListHeaderComponent={
            <>
              <DailyNotesSection/>
              <Formik
                initialValues={project.preferences || {}}
                onSubmit={() => console.log('Submitting form project preferences...')}
                innerRef={preferencesFormRef}
              >
                {formProps =>
                  <View>
                    <SectionDivider dividerText={'Privacy Settings'}/>
                    <ListItem containerStyle={commonStyles.listItemFormField}>
                      <ListItem.Content>
                        <ListItem.Title style={commonStyles.listItemTitle}>Make Project Public? </ListItem.Title>
                      </ListItem.Content>
                      <Switch
                        value={formProps.values.public}
                        onValueChange={(bool) => {
                          formProps.setFieldValue('public', bool);
                          setPageData(d => ({...d, public: bool}));
                        }}
                      />
                    </ListItem>
                    <View style={{paddingBottom: 15}}>
                      <Text style={commonStyles.noValueText}>Datasets that are made public can be accessed by anyone at
                        Strabospot.org/search. {'\n'} Privacy settings are reversible.
                        Settings will be updated when you upload the project to the server.
                      </Text>
                    </View>
                  </View>
                }
              </Formik>
            </>
          }
        />
      </View>
    </>
  );
};

export default ProjectDescription;
