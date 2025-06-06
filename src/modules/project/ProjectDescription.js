import React, {useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {Formik} from 'formik';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {updatedProject} from './projects.slice';
import {isEqual} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import {Form, useForm} from '../form';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../main-menu-panel/sidePanel/SidePanelHeader';

const ProjectDescription = () => {
  const dispatch = useDispatch();
  const project = useSelector(state => state.project.project);

  const {getLabel, hasErrors, validateForm} = useForm();
  const toast = useToast();

  const descriptionFormRef = useRef(null);

  const [isDirty, setIsDirty] = useState(false);

  const formName = ['general', 'project_description'];
  const projectDescription = {
    ...project.description,
    gps_datum: project.description?.gps_datum || 'WGS84 (Default)',
    magnetic_declination: project.description?.magnetic_declination || 0,
  };

  const handleBackPressed = async () => {
    if (isDirty) {
      await saveForm();
      toast.show('Changes Saved!', 'success');
    }
    dispatch(setSidePanelVisible({bool: false}));
  };

  const saveForm = async () => {
    const descriptionCurrent = descriptionFormRef.current;
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
  };

  return (
    <>
      <SidePanelHeader
        title={isDirty ? 'Active Project (Save Changes)' : 'Active Project'}
        headerTitle={'Project Description'}
        backButton={handleBackPressed}
      />
      <View style={{flex: 1}}>
        <FlatList
          ListHeaderComponent={
            <Formik
              innerRef={descriptionFormRef}
              onSubmit={values => console.log('Submitting form...', values)}
              validate={(values) => {
                validateForm({formName: formName, values: values});
                if (isDirty && isEqual(projectDescription, values)) setIsDirty(false);
                else if (!isDirty && !isEqual(projectDescription, values)) setIsDirty(true);
              }}
              component={formProps => Form({formName: formName, ...formProps})}
              initialValues={projectDescription}
              validateOnChange={true}
            />
          }
        />
      </View>
    </>
  );
};

export default ProjectDescription;
