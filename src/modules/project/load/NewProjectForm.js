import React, {useRef} from 'react';
import {FlatList, View} from 'react-native';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {SECONDARY_BACKGROUND_COLOR} from '../../../shared/styles.constants';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import {Form, useForm} from '../../form';
import {setIsProjectLoadSelectionModalVisible} from '../../home/home.slice';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import {PROJECT_DESCRIPTION_FORM_NAME} from '../project.constants';
import useProject from '../useProject';

const initialValues = {
  start_date: new Date().toISOString(),
  gps_datum: 'WGS84 (Default)',
  magnetic_declination: 0,
};

const NewProjectForm = ({openMainMenuPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isProjectLoadSelectionModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);

  const {submitAndShowErrors, validateForm} = useForm();
  const {initializeNewProject} = useProject();

  /* Local State */

  const formRef = useRef(null);

  /* Logic Helpers */

  const saveForm = async () => {
    try {
      const {values: formValues} = await submitAndShowErrors(formRef.current);
      console.log('Saving form...');
      await initializeNewProject(formValues);
      console.log('New Project created', formValues.project_name);
      if (isProjectLoadSelectionModalVisible) dispatch(setIsProjectLoadSelectionModalVisible(false));
      dispatch(setSidePanelVisible({bool: false}));
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS}));
      if (openMainMenuPanel) openMainMenuPanel();
      return Promise.resolve();
    }
    catch (err) {
      console.error('Error submitting form', err);
      return Promise.reject();
    }
  };

  /* Render Functions */

  const renderFormFields = () => {
    console.log('Rendering form:', PROJECT_DESCRIPTION_FORM_NAME.join('.'), 'with values:', initialValues);
    return (
      <Formik
        enableReinitialize={false}
        initialStatus={{formName: PROJECT_DESCRIPTION_FORM_NAME}}
        initialValues={initialValues}
        innerRef={formRef}
        onSubmit={values => console.log('Submitting form...', values)}
        validate={values => validateForm({formName: PROJECT_DESCRIPTION_FORM_NAME, values: values})}
      >
        {formProps => <Form {...formProps} formName={PROJECT_DESCRIPTION_FORM_NAME}/>}
      </Formik>
    );
  };

  /* View */

  return (
    <View style={{flex: 1, backgroundColor: SECONDARY_BACKGROUND_COLOR}}>
      {/* Pass the rendered element, not the function: a function prop is a new component type each
       render, which remounts Formik and wipes entered values (e.g. on a map tap that re-renders). */}
      <FlatList ListHeaderComponent={renderFormFields()}/>
      <OutlineButton
        onPress={saveForm}
        title={'Save New Project'}
      />
    </View>
  );
};

export default NewProjectForm;
