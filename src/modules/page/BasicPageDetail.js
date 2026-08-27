import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import PageHeader from './PageHeader';
import {PAGE_KEYS} from './pageKeys.constants';
import {isEmpty, isEqual, toTitleCase} from '../../shared/helpers';
import {RED} from '../../shared/styles.constants';
import {FormFlatList} from '../../shared/ui';
import alert from '../../shared/ui/alert';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {onOrientationChange} from '../compass/compass.helpers';
import {Form, FormikWrapper, useForm} from '../form';
import {EARTHQUAKE_ORIENTATION_FIELDS} from '../geomorph/geomorph.constants';
import {overlayStyles} from '../home/overlays';
import usePetrology from '../petrology/usePetrology';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import IGSNModal from '../samples/igsn/IGSNModal';
import {LITHOLOGY_SUBPAGES} from '../sed/sed.constants';
import {getRequiredLithologyKeys} from '../sed/sed.helpers';
import useSed from '../sed/useSed';
import {useSpots} from '../spots';
import {editedSpotProperties, setSelectedAttributes} from '../spots/spots.slice';
import {useTags} from '../tags';
import {THREE_D_STRUCTURE_ORIENTATION_FIELDS} from '../three-d-structures/threeDStructures.constants';
import {messages} from './ui/Messages';

const BasicPageDetail = ({
                           PageTabsComponent,
                           closeDetailView,
                           deleteTemplate,
                           groupKey = 'general',
                           isReadOnly,
                           page,
                           registerGetValues,
                           saveTemplate,
                           selectedFeature,
                           // Reports the fields in error up to a tabbed page, so it can mark the tab holding one
                           setInvalidFields,
                           siblingSurvey,
                         }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {isInternetReachable} = useSelector(state => state.connections.isOnline);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {showErrors, submitAndShowErrors, validateForm} = useForm();
  const {deletePetFeature, onMineralChange, savePetFeature} = usePetrology();
  const {deleteSedFeature, onSedFormChange, saveSedBedFeature, saveSedFeature} = useSed();
  const {checkSampleName} = useSpots();
  const {deleteFeatureTags} = useTags();
  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);
  // The values already dealt with, by a save or by a caller taking them to write itself. Leaving straight
  // afterwards must not ask about them again, and the page can unmount in the same render pass as the save, so
  // the form ref may still be holding what it looked like beforehand.
  const savedValuesRef = useRef(null);
  const [igsnFormValues, setIgsnFormValues] = useState(null);
  const [initialValues, setInitialValues] = useState(selectedFeature);
  const [isDeleteOverlayVisible, setIsDeleteOverlayVisible] = useState(false);
  const [isFormInvalid, setIsFormInvalid] = useState(false);
  const [isIGSNChecked, setIsIGSNChecked] = useState(selectedFeature.isOnMySesar || false);
  const [isIGSNModalVisible, setIsIGSNModalVisible] = useState(false);
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);

  /* Derived Variables */

  const pageKey = page.key === PAGE_KEYS.FABRICS && selectedFeature.type === 'fabric' ? '_3d_structures'
    : page.key === PAGE_KEYS.ROCK_TYPE_SEDIMENTARY ? PAGE_KEYS.LITHOLOGIES : page.key;
  let pageData = pageKey === PAGE_KEYS.NOTES ? {} : [];
  if (spot && spot.properties) {
    if (spot.properties[groupKey] && spot.properties[groupKey][pageKey]) pageData = spot.properties[groupKey][pageKey];
    else if (spot.properties[pageKey]) pageData = spot.properties[pageKey];
  }
  const isTemplate = saveTemplate;
  // Pages whose form fills one orientation field in from another name the pairs it uses
  const orientationFields = page.key === PAGE_KEYS.THREE_D_STRUCTURES ? THREE_D_STRUCTURE_ORIENTATION_FIELDS
    : page.key === PAGE_KEYS.EARTHQUAKES ? EARTHQUAKE_ORIENTATION_FIELDS
      : undefined;
  const title = groupKey === 'pet' && pageKey === PAGE_KEYS.ROCK_TYPE_IGNEOUS
  && !selectedFeature.rock_type && selectedFeature.igneous_rock_class
    ? toTitleCase(selectedFeature.igneous_rock_class.replace('_', ' ') + ' Rock')
    : page.label_singular || toTitleCase(page.label).slice(0, -1);

  /* Side Effects */

  useEffect(() => {
    setIsSaveDisabled(selectedFeature.isOnMySesar && selectedFeature.Sample_IGSN && !isInternetReachable);
  }, [selectedFeature.isOnMySesar, selectedFeature.Sample_IGSN, isInternetReachable]);

  useLayoutEffect(() => {
    console.log('ULE BasicPageDetail []');
    return () => !isReadOnly && confirmLeavePage();
  }, []);

  useEffect(() => {
    console.log('UE BasicPageDetail []');
    setInitialValues(selectedFeature);
    return () => {
      if (registerGetValues) registerGetValues.current = null;
      dispatch(setSelectedAttributes([]));
    };
  }, []);

  useEffect(() => {
    console.log('UE BasicPageDetail [selectedFeature]', selectedFeature);
    setInitialValues(selectedFeature);
    if (!isTemplate && isEmpty(selectedFeature)) closeDetailView();
  }, [selectedFeature]);

  /* Event Handlers */

  const onSampleSaved = async (formCurrent) => {
    console.log('Saving Sample To SESAR', formRef.current?.values);
    await saveFeature(formCurrent);
    closeDetailView();
  };

  const onSubmitForm = (values, {resetForm}) => {
    console.log('Submitting form...', values);
    setInitialValues(values);
    resetForm({values});
    console.log('Reset form...');
  };

  /* Logic Helpers */

  const cancelForm = async () => {
    closeDetailView();
  };

  const confirmLeavePage = () => {
    const description = isIGSNChecked
      ? 'Would you like to save your data before continuing? \n\n This sample was not registered to SESAR. Please re-save sample to register to SESAR.'
      : 'Would you like to save your data before continuing?';
    if (!isTemplate && formRef.current?.dirty && !isEqual(formRef.current.values, savedValuesRef.current)) {
      const formCurrent = formRef.current;
      alert('Unsaved Changes',
        description,
        [{
          text: 'No',
          style: 'cancel',
        }, {
          text: 'Yes',
          onPress: () => saveForm(formCurrent, true),
        }],
        {cancelable: false},
      );
    }
  };

  const deleteFeature = () => {
    deleteFeatureTags([selectedFeature]);
    if (groupKey === 'pet') deletePetFeature(pageKey, spot, selectedFeature);
    else if (groupKey === 'sed') deleteSedFeature(pageKey, spot, selectedFeature);
    else {
      let editedPageData = pageData ? JSON.parse(JSON.stringify(pageData)) : [];
      editedPageData = editedPageData.filter(f => f.id !== selectedFeature.id);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: pageKey, value: editedPageData}));
    }
    dispatch(setSelectedAttributes([]));
    closeDetailView();
  };

  const deleteFeatureConfirm = () => {
    if (pageKey === PAGE_KEYS.SAMPLES && selectedFeature.isOnMySesar) {
      setIsDeleteOverlayVisible(true);
    }
    else {
      alert('Delete ' + title,
        'Are you sure you would like to delete this ' + title + '?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: () => deleteFeature(),
          },
        ],
        {cancelable: false},
      );
    }
  };

  const getFormName = () => {
    let formName = [groupKey, pageKey];
    if (groupKey === 'pet' && selectedFeature.rock_type) formName = ['pet_deprecated', pageKey];
    else if (groupKey === 'pet' && pageKey === 'igneous') formName = [groupKey, selectedFeature.igneous_rock_class];
    else if (pageKey === '_3d_structures' || pageKey === 'fabrics') formName = [pageKey, selectedFeature.type];
    else if (page.subkey) formName = [pageKey, page.subkey];
    console.log('Rendering form:', formName[0] + '.' + formName[1]);
    return formName;
  };

  // A lithology in an interval mapped on a strat section has to answer fields its survey marks optional, which a
  // survey rule cannot express because it turns on the Spot rather than the form. The lithology is one record
  // across its tabs, so all of them hold Save until it is complete, while each tab marks the fields it shows.
  const getRequiredFields = (values) => {
    if (groupKey !== 'sed' || !Object.values(LITHOLOGY_SUBPAGES).includes(pageKey)) return [];
    return getRequiredLithologyKeys(values, spot);
  };

  const getIsDisabled = (fieldName) => {
    if (isReadOnly) return true;
    else {
      return selectedFeature.isOnMySesar && selectedFeature.Sample_IGSN
        ? isInternetReachable
          ? fieldName === 'Sample_IGSN' : true
        : false;
    }
  };

  // Fields a feature requires beyond its survey are checked with it, so they hold Save the same way
  const validateFeature = (formName, values) => {
    const {errors} = validateForm({formName: formName, values: values});
    // Every tab edits the same record, so a field left unanswered on another tab holds Save just as one here
    // does, and SubpageTabs marks the tab holding it. Errors only - what a save writes is still cleaned by the
    // survey of the tab being shown, which is also the reading that wins for a field both tabs define.
    const siblingErrors = siblingSurvey ? validateForm({survey: siblingSurvey, values: values}).errors : {};
    return getRequiredFields(values).reduce(
      (acc, key) => (isEmpty(values[key]) ? {...acc, [key]: 'Required'} : acc), {...siblingErrors, ...errors});
  };

  const saveButtonOnPress = () => {
    isTemplate ? saveTemplateForm(formRef.current) : saveForm(formRef.current);
  };

  const saveFeature = async (formCurrent, isLeavingPage) => {
    try {
      const {errors, values: editedFeatureData} = await submitAndShowErrors(formRef.current || formCurrent,
        isLeavingPage);
      console.log('Saving', page.label, 'data', editedFeatureData, 'to Spot', pageData);
      let editedPageData = pageData ? JSON.parse(JSON.stringify(pageData)) : [];
      const i = editedPageData.findIndex(f => f.id === editedFeatureData.id);
      if (i === -1) editedPageData.push(editedFeatureData);
      else editedPageData.splice(i, 1, editedFeatureData);
      const spotId = spot.properties.id;
      dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
      dispatch(editedSpotProperties({field: pageKey, value: editedPageData, spotId: spotId}));

      if (page.key === PAGE_KEYS.SAMPLES && editedFeatureData.sample_id_name) {
        if (spot.properties.isSample && spot.properties.name !== editedFeatureData.sample_id_name) {
          dispatch(editedSpotProperties({field: 'name', value: editedFeatureData.sample_id_name, spotId: spotId}));
        }
        await checkSampleName(editedFeatureData.sample_id_name);
      }
      // Reported up so the caller can tell a full save from a partial one
      return errors;
    }
    catch (err) {
      console.error('Error saving', pageKey, err);
      throw err;
    }
  };

  // The values the open form would save, for a caller that is about to write them somewhere itself. The samples
  // footer converts a sample to a rich sample while this form is open (NotebookFooter) and puts these values in
  // the new sample. They are deliberately not written to this Spot on the way: the conversion replaces the
  // sample here with nothing but its id a moment later, so saving first only adds a write that is immediately
  // undone - and on web every write is an upload, of a Spot that is already about to change again.
  // Refuses the same way a save would, alerting and throwing, so a caller cannot carry a bad value forward.
  const getOpenFeatureValues = async () => {
    const formCurrent = formRef.current;
    if (isReadOnly || isTemplate || !formCurrent?.dirty) return undefined;
    const errors = await formCurrent.validateForm();
    const values = showErrors({...formCurrent, errors: errors});
    // Marks these values as dealt with, so leaving the page does not go on to ask about them
    savedValuesRef.current = {...formCurrent.values};
    return values;
  };

  // Whether the page is being left is the caller's to say. Reading it back off the ref guessed, and guessed
  // wrong whenever the prompt was answered before the form had gone: an edit meant to be kept apart from its
  // one bad field was refused whole instead.
  const saveForm = async (formCurrent, isLeavingPage) => {
    try {
      console.log('Saving form...', formCurrent);
      if (formCurrent?.values.Sample_IGSN && formCurrent?.values.isOnMySesar) {
        await updateIGSNAndShowModal(formCurrent);
        return;
      }
      let errors;
      if (groupKey === 'pet') {
        errors = await savePetFeature(pageKey, spot, formRef.current || formCurrent, isLeavingPage);
      }
      else if (groupKey === 'sed' && pageKey === 'bedding') {
        errors = await saveSedBedFeature(pageKey, spot, formRef.current || formCurrent, isLeavingPage);
      }
      else if (groupKey === 'sed') {
        errors = await saveSedFeature(pageKey, spot, formRef.current || formCurrent, isLeavingPage);
      }
      else errors = await saveFeature(formCurrent, isLeavingPage);
      savedValuesRef.current = {...(formRef.current || formCurrent).values};
      // Leaving the page with invalid fields alerts and saves only the valid ones, so don't claim a full save
      if (Platform.OS !== 'web' && isEmpty(errors)) toast.show('Changes Saved', {type: 'success'});
      closeDetailView();
      console.log('Done');
    }
    catch (err) {
      toast.show('Error Saving Changes', {type: 'danger'});
      console.error('ERROR saving form', err);
    }
  };

  const saveTemplateForm = async (formCurrent) => {
    const {values: formValues} = await submitAndShowErrors(formRef.current || formCurrent);
    saveTemplate(formValues);
  };

  const updateIGSNAndShowModal = async (formCurrent) => {
    const values = {...formCurrent.values};
    await saveFeature(formCurrent);
    setIgsnFormValues(values);
    setIsIGSNModalVisible(true);
  };

  // Expose the values to a parent-owned button that carries this form's edits somewhere (see NotebookFooter)
  if (registerGetValues) registerGetValues.current = getOpenFeatureValues;

  /* Render Functions */

  const renderFormFields = () => {
    const formName = getFormName();
    return (
      <View style={{flex: 1}}>
        <FormikWrapper
          enableReinitialize={true}
          formName={formName}
          initialValues={initialValues}
          innerRef={formRef}
          onReset={() => console.log('Resetting form...')}
          onSubmit={onSubmitForm}
          setInvalidFields={setInvalidFields}
          setIsFormInvalid={setIsFormInvalid}
          validate={values => validateFeature(formName, values)}
        >
          {formProps => (
            <Form
              {...formProps}
              formName={formName}
              getIsDisabled={getIsDisabled}
              isReadOnly={isReadOnly}
              onMyChange={page.key === PAGE_KEYS.MINERALS
                ? ((name, value) => onMineralChange(formRef.current, name, value))
                : page.key === LITHOLOGY_SUBPAGES.LITHOLOGY
                  ? ((name, value) => onSedFormChange(formRef.current, name, value))
                  : undefined}
              onNumberChange={orientationFields ? ((name, value) => onOrientationChange(formRef.current, name, value,
                  {orientationFields: orientationFields}))
                : undefined}
              requiredFields={getRequiredFields(formProps.values)}
              siblingSurvey={siblingSurvey}
            />
          )}
        </FormikWrapper>
        {!isReadOnly && (
          <DeleteButton
            onPress={() => isTemplate ? deleteTemplate() : deleteFeatureConfirm()}
            title={'Delete ' + title + (isTemplate ? ' Template' : '')}
          />
        )}
      </View>
    );
  };

  /* View */

  return (
    <>
      <View style={{flex: 1}}>
        {(isTemplate || !isEmpty(selectedFeature)) && (
          <>
            <PageHeader hideBackButton={!isReadOnly} onPressBack={cancelForm} pageTitle={title + ' Detail'}/>
            {PageTabsComponent && PageTabsComponent}
            {!isReadOnly && (
              <>
                {pageKey === PAGE_KEYS.SAMPLES && isSaveDisabled && (
                  <View>
                    <Text style={{
                      color: RED,
                      fontSize: 16,
                      fontWeight: '500',
                      padding: 10,
                      textAlign: 'center',
                    }}>
                      This sample has an IGSN assigned and must be updated with SESAR. Please save changes when device
                      is online.
                    </Text>
                  </View>
                )}
                <SaveAndCancelButtons
                  cancel={cancelForm}
                  getIsDisabled={isSaveDisabled || isFormInvalid}
                  save={saveButtonOnPress}
                />
              </>
            )}
            {/*{page.key === PAGE_KEYS.SAMPLES && Platform.OS !== 'web' && !isReadOnly && spot.geometry.type !== 'Polygon'}*/}
            <FormFlatList contentContainerStyle={{paddingBottom: 200}}>
              {renderFormFields()}
            </FormFlatList>
          </>
        )}
        <IGSNModal
          isVisible={isIGSNModalVisible}
          onIGSNUpdated={closeDetailView}
          onModalCancel={() => setIsIGSNModalVisible(false)}
          onSampleSaved={onSampleSaved}
          ref={formRef}
          sampleValues={igsnFormValues}
        />

        {/*Modal when deleting a sample with an IGSN attached*/}
        <ModalWrapper
          actionTitle={'Delete'}
          headerTitle={'Delete Sample'}
          isVisible={isDeleteOverlayVisible}
          onActionPressed={deleteFeature}
          onCancelPress={() => setIsDeleteOverlayVisible(false)}
          overlayStyleOverride={{height: '40%'}}
        >
          <View style={{
            flex: 1,
            paddingVertical: 10,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'yellow',
          }}>
            <Text style={{...overlayStyles.titleText, color: RED}}>WARNING!</Text>
            <Text style={{...overlayStyles.titleText, color: RED}}>{messages.delete.title}</Text>
          </View>
          <View style={{flex: 4, justifyContent: 'center', alignItems: 'center'}}>
            <Text
              style={{...overlayStyles.statusMessageText, fontSize: 16, fontWeight: '500'}}>{messages.delete.message}
            </Text>
          </View>
        </ModalWrapper>
      </View>
    </>
  );
};

export default BasicPageDetail;
