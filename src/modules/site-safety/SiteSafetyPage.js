import React, {useLayoutEffect, useRef, useState} from 'react';
import {Platform, View} from 'react-native';

import * as turf from '@turf/turf';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {isEmpty, isEqual} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import SectionDivider from '../../shared/ui/SectionDivider';
import {Form, FormFlatList, FormikWrapper, useForm} from '../form';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {SUPPLEMENTAL_PAGES} from '../page/page.constants';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const formName = ['general', 'site_safety'];

const SiteSafetyPage = ({isReadOnly}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {submitAndShowErrors} = useForm();
  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);
  // The values already saved, so leaving straight afterwards does not ask about them again. The form's own
  // dirty flag is not enough on its own: the page can unmount in the same render pass as the save, leaving
  // this ref holding the form as it was before it.
  const savedValuesRef = useRef(null);

  const [isFormInvalid, setIsFormInvalid] = useState(false);

  /* Derived Variables */

  const coord = spot?.geometry?.type === 'Point' ? turf.getCoord(spot) : undefined;
  let initialValues = spot.properties?.site_safety || {};
  if (isEmpty(initialValues) && !isEmpty(coord)) {
    initialValues = {latitude: coord[1].toString(), longitude: coord[0].toString()};
  }
  const page = SUPPLEMENTAL_PAGES.find(p => p.key === PAGE_KEYS.SITE_SAFETY);

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
    if (formRef.current?.dirty && !isEqual(formRef.current.values, savedValuesRef.current)) {
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
      const {values: editedSiteSafetyFormData} = await submitAndShowErrors(currentForm);
      const spotId = spot.properties.id;
      dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
      dispatch(editedSpotProperties({field: 'site_safety', value: editedSiteSafetyFormData, spotId: spotId}));
      savedValuesRef.current = {...currentForm.values};
      await currentForm.resetForm();
      if (Platform.OS !== 'web') toast.show('Site Safety Saved', {type: 'success'});
    }
    catch (err) {
      console.error('Error submitting form', err);
      return Promise.reject();
    }
  };

  const saveFormAndGo = async (currentForm = formRef.current) => {
    try {
      await saveForm(currentForm);
      dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
    catch (err) {
      console.error('Error saving form data to Spot');
    }
  };

  /* Render Functions */

  const renderCancelSaveButtons = () => {
    return (
      <View>
        <SaveAndCancelButtons
          cancel={() => cancelFormAndGo()}
          getIsDisabled={isFormInvalid}
          save={() => saveFormAndGo()}
        />
      </View>
    );
  };

  const renderSiteSafetyForm = () => {
    return (
      <FormikWrapper
        enableReinitialize={true}
        formName={formName}
        initialValues={initialValues}
        innerRef={formRef}
        onReset={() => console.log('Resetting form...')}
        setIsFormInvalid={setIsFormInvalid}
      >
        {formProps => <Form {...formProps} formName={formName} isReadOnly={isReadOnly}/>}
      </FormikWrapper>
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <PageHeader hideBackButton={!isReadOnly} onPressBack={cancelFormAndGo} pageTitle={page.label}/>
      {!isReadOnly && renderCancelSaveButtons()}
      <FormFlatList contentContainerStyle={{paddingBottom: 200}}>
        <SectionDivider dividerText={page.label}/>
        {renderSiteSafetyForm()}
      </FormFlatList>
    </View>
  );
};

export default SiteSafetyPage;
