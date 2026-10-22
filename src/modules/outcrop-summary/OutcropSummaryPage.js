import React, {useContext, useRef} from 'react';
import {Platform, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {getNewUUID, isEmpty} from '../../shared/helpers';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import Form from '../form/Form';
import FormFlatList from '../form/FormFlatList';
import FormikWrapper from '../form/FormikWrapper';
import useForm from '../form/useForm';
import {LeavePageContext, useUnsavedFormChanges} from '../notebook-panel/LeavePageContext';
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
  const {goToNotebookPage} = useContext(LeavePageContext);

  const {submitAndShowErrors} = useForm();
  const toast = useToast();

  const formRef = useRef(null);
  const {markSaved, setIsFormDirty} = useUnsavedFormChanges({
    formRef: formRef,
    getMessage: () => `Your changes to ${page.label} haven't been saved.`,
    save: () => saveForm(formRef.current),
  });

  /* Derived Variables */

  // Outcrop summaries are stored as an array but only one per Spot is shown for now
  const outcropSummaries = spot.properties?.[pageKey] || [];
  const initialValues = outcropSummaries[0] || {};

  /* Logic Helpers */

  const cancelFormAndGo = () => goToNotebookPage(PAGE_KEYS.OVERVIEW);

  // Reports whether the save happened. A refusal has already alerted about the field it stopped on, so a caller
  // stays where it is for that to be fixed rather than carrying on.
  const saveForm = async (currentForm) => {
    try {
      const {errors, values: editedOutcropSummaryData} = await submitAndShowErrors(currentForm);
      const spotId = spot.properties.id;
      // An empty form saves an empty array, which removes the property from the Spot
      const editedOutcropSummaries = isEmpty(editedOutcropSummaryData) ? []
        : [{...editedOutcropSummaryData, id: outcropSummaries[0]?.id || getNewUUID()}];
      dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
      dispatch(editedSpotProperties({field: pageKey, value: editedOutcropSummaries, spotId: spotId}));
      markSaved();
      await currentForm.resetForm();
      // A value already invalid when the form opened is rolled back and the rest saved, so don't claim a full save
      if (Platform.OS !== 'web' && isEmpty(errors)) toast.show('Outcrop Summary Saved', {type: 'success'});
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
        setIsFormDirty={setIsFormDirty}
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
