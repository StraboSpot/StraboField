import React, {useLayoutEffect, useRef} from 'react';
import {Platform, View} from 'react-native';

import * as turf from '@turf/turf';
import {Formik} from 'formik';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import SectionDivider from '../../shared/ui/SectionDivider';
import {Form, useForm} from '../form';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {SECONDARY_PAGES} from '../page/page.constants';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const formName = ['general', 'site_safety'];

const SiteSafetyPage = ({isReadOnly}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {showErrors, validateForm} = useForm();
  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);

  /* Derived Variables */

  const coord = spot?.geometry?.type === 'Point' ? turf.getCoord(spot) : undefined;
  let initialValues = spot.properties?.site_safety || {};
  if (isEmpty(initialValues) && !isEmpty(coord)) {
    initialValues = {latitude: coord[1].toString(), longitude: coord[0].toString()};
  }
  const page = SECONDARY_PAGES.find(p => p.key === PAGE_KEYS.SITE_SAFETY);

  /* Side Effects */

  useLayoutEffect(() => {
    console.log('ULE SiteSafetyPage []');
    return () => confirmLeavePage();
  }, []);

  /* Logic Helpers */

  const cancelFormAndGo = () => {
    dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
  };

  const confirmLeavePage = () => {
    if (formRef.current && formRef.current.dirty) {
      const formCurrent = formRef.current;
      alert('Unsaved Changes',
        'Would you like to save your data before continuing?',
        [{
          text: 'No',
          style: 'cancel',
        }, {
          text: 'Yes',
          onPress: () => saveFormAndGo(formCurrent),
        }],
        {cancelable: false},
      );
    }
  };

  const saveForm = async (currentForm) => {
    try {
      await currentForm.submitForm();
      const editedSiteSafetyFormData = showErrors(currentForm);
      const spotId = spot.properties.id;
      dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
      dispatch(editedSpotProperties({field: 'site_safety', value: editedSiteSafetyFormData, spotId: spotId}));
      await currentForm.resetForm();
      if (Platform.OS !== 'web') toast.show('Site Safety Saved', {type: 'success'});
    }
    catch (err) {
      console.log('Error submitting form', err);
      return Promise.reject();
    }
  };

  const saveFormAndGo = async (currentForm = formRef.current) => {
    try {
      await saveForm(currentForm);
      dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
    catch (e) {
      console.log('Error saving form data to Spot');
    }
  };

  /* Render Functions */

  const renderCancelSaveButtons = () => {
    return (
      <View>
        <SaveAndCancelButtons
          cancel={() => cancelFormAndGo()}
          save={() => saveFormAndGo()}
        />
      </View>
    );
  };

  const renderSiteSafetyForm = () => {
    return (
      <Formik
        enableReinitialize={true}
        initialStatus={{formName: formName}}
        initialValues={initialValues}
        innerRef={formRef}
        onReset={() => console.log('Resetting form...')}
        onSubmit={values => console.log('Submitting form...', values)}
        validate={values => validateForm({formName: formName, values: values})}
      >
        {formProps => <Form {...{...formProps, formName: formName, isReadOnly: isReadOnly, scrollEnabled: false}}/>}
      </Formik>
    );
  };

  /* View */

  return (
    <>
      <PageHeader hideBackButton={!isReadOnly} onPressBack={cancelFormAndGo} pageTitle={'Site Safety'}/>
      {!isReadOnly && renderCancelSaveButtons()}
      <KeyboardAwareScrollView
        style={{flex: 1}}
      >
        <SectionDivider dividerText={page.label}/>
        {renderSiteSafetyForm()}
      </KeyboardAwareScrollView>
    </>
  );
};

export default SiteSafetyPage;
