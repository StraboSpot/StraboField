import React, {useContext, useRef} from 'react';
import {Platform, View} from 'react-native';

import * as turf from '@turf/turf';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../shared/helpers';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import SectionDivider from '../../shared/ui/SectionDivider';
import Form from '../form/Form';
import FormFlatList from '../form/FormFlatList';
import FormikWrapper from '../form/FormikWrapper';
import useForm from '../form/useForm';
import {LeavePageContext, useUnsavedFormChanges} from '../notebook-panel/LeavePageContext';
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
  const {goToNotebookPage} = useContext(LeavePageContext);

  const {submitAndShowErrors} = useForm();
  const toast = useToast();

  const formRef = useRef(null);
  const {isFormInvalid, markSaved, setIsFormDirty, setIsFormInvalid} = useUnsavedFormChanges({
    formRef: formRef,
    getMessage: () => `Your changes to ${page.label} haven't been saved.`,
    save: () => saveForm(formRef.current),
  });

  /* Derived Variables */

  const coord = spot?.geometry?.type === 'Point' ? turf.getCoord(spot) : undefined;
  let initialValues = spot.properties?.site_safety || {};
  if (isEmpty(initialValues) && !isEmpty(coord)) {
    initialValues = {latitude: coord[1].toString(), longitude: coord[0].toString()};
  }
  const page = SUPPLEMENTAL_PAGES.find(p => p.key === PAGE_KEYS.SITE_SAFETY);

  /* Logic Helpers */

  const cancelFormAndGo = () => goToNotebookPage(PAGE_KEYS.OVERVIEW);

  // Reports whether the save happened. A refusal has already alerted about the field it stopped on, so a caller
  // stays where it is for that to be fixed rather than carrying on.
  const saveForm = async (currentForm) => {
    try {
      const {errors, values: editedSiteSafetyFormData} = await submitAndShowErrors(currentForm);
      const spotId = spot.properties.id;
      dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
      dispatch(editedSpotProperties({field: 'site_safety', value: editedSiteSafetyFormData, spotId: spotId}));
      markSaved();
      await currentForm.resetForm();
      // A value already invalid when the form opened is rolled back and the rest saved, so don't claim a full save
      if (Platform.OS !== 'web' && isEmpty(errors)) toast.show('Site Safety Saved', {type: 'success'});
      return true;
    }
    catch (err) {
      console.error('Error submitting form', err);
      return false;
    }
  };

  const saveFormAndGo = async (currentForm = formRef.current) => {
    if (await saveForm(currentForm)) dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
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
        setIsFormDirty={setIsFormDirty}
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
