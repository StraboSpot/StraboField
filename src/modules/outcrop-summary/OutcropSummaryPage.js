import React, {useLayoutEffect, useRef} from 'react';
import {Platform, View} from 'react-native';

import {Formik} from 'formik';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {getNewUUID, isEmpty} from '../../shared/helpers';
import {FormFlatList} from '../../shared/ui';
import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import {Form, useForm} from '../form';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const pageKey = PAGE_KEYS.OUTCROP_SUMMARIES;
const formName = ['general', pageKey];

const OutcropSummaryPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {showErrors, validateForm} = useForm();
  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);

  /* Derived Variables */

  // Outcrop summaries are stored as an array but only one per Spot is shown for now
  const outcropSummaries = spot.properties?.[pageKey] || [];
  const initialValues = outcropSummaries[0] || {};

  /* Side Effects */

  useLayoutEffect(() => {
    console.log('ULE OutcropSummaryPage []');
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
      const editedOutcropSummaryData = showErrors(currentForm);
      const spotId = spot.properties.id;
      // An empty form saves an empty array, which removes the property from the Spot
      const editedOutcropSummaries = isEmpty(editedOutcropSummaryData) ? []
        : [{...editedOutcropSummaryData, id: outcropSummaries[0]?.id || getNewUUID()}];
      dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
      dispatch(editedSpotProperties({field: pageKey, value: editedOutcropSummaries, spotId: spotId}));
      await currentForm.resetForm();
      if (Platform.OS !== 'web') toast.show('Outcrop Summary Saved', {type: 'success'});
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

  const renderOutcropSummaryForm = () => {
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
        {formProps => <Form {...{...formProps, formName: formName, isReadOnly: isReadOnly}}/>}
      </Formik>
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <PageHeader hideBackButton={!isReadOnly} onPressBack={cancelFormAndGo} pageTitle={page.label}/>
      {!isReadOnly && renderCancelSaveButtons()}
      <FormFlatList contentContainerStyle={{paddingBottom: 200}}>
        {renderOutcropSummaryForm()}
      </FormFlatList>
    </View>
  );
};

export default OutcropSummaryPage;
