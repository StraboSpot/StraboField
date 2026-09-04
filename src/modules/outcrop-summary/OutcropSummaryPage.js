import React, {useLayoutEffect, useRef} from 'react';
import {Platform, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {getNewUUID, isEmpty, isEqual} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import {Form, FormFlatList, FormikWrapper, useForm} from '../form';
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

  const {submitAndShowErrors} = useForm();
  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);
  // The values already saved, so leaving straight afterwards does not ask about them again. The form's own
  // dirty flag is not enough on its own: the page can unmount in the same render pass as the save, leaving
  // this ref holding the form as it was before it.
  const savedValuesRef = useRef(null);

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

  // Reports whether the save happened. A refusal has already alerted about the field it stopped on, so a caller
  // stays where it is for that to be fixed rather than carrying on.
  const saveForm = async (currentForm) => {
    try {
      const {values: editedOutcropSummaryData} = await submitAndShowErrors(currentForm);
      const spotId = spot.properties.id;
      // An empty form saves an empty array, which removes the property from the Spot
      const editedOutcropSummaries = isEmpty(editedOutcropSummaryData) ? []
        : [{...editedOutcropSummaryData, id: outcropSummaries[0]?.id || getNewUUID()}];
      dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
      dispatch(editedSpotProperties({field: pageKey, value: editedOutcropSummaries, spotId: spotId}));
      savedValuesRef.current = {...currentForm.values};
      await currentForm.resetForm();
      if (Platform.OS !== 'web') toast.show('Outcrop Summary Saved', {type: 'success'});
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
          save={() => saveFormAndGo()}
        />
      </View>
    );
  };

  const renderOutcropSummaryForm = () => {
    return (
      <FormikWrapper
        enableReinitialize={true}
        formName={formName}
        initialValues={initialValues}
        innerRef={formRef}
        onReset={() => console.log('Resetting form...')}
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
        {renderOutcropSummaryForm()}
      </FormFlatList>
    </View>
  );
};

export default OutcropSummaryPage;
