import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {FlatList, Keyboard, Platform, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {Formik} from 'formik';
import Toast, {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {getNewId, isEmpty, numToLetter, sleep} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR, SMALL_SCREEN} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, FormSlider, MainButtons, useForm} from '../form';
import {setLoadingStatus, setModalVisible} from '../home/home.slice';
import useMapLocation from '../maps/useMapLocation';
import {MODAL_KEYS} from '../page/page.constants';
import {updatedModifiedTimestampsBySpotsIds, updatedProject} from '../project/projects.slice';
import {useSpots} from '../spots';
import {editedOrCreatedSpot, editedSpotProperties} from '../spots/spots.slice';

const SampleModal = ({onPress, zoomToCurrentLocation}) => {
  const dispatch = useDispatch();
  const modalVisible = useSelector(state => state.home.modalVisible);
  const preferences = useSelector(state => state.project.project?.preferences) || {};
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getChoices, getRelevantFields, getSurvey} = useForm();
  const {checkSampleName, getNewSpotName} = useSpots();
  const toast = useToast();
  const {setPointAtCurrentLocation} = useMapLocation();

  const initialNamePrefix = preferences.sample_prefix || '';

  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [namePostfix, setNamePostfix] = useState(null);
  const [namePrefix, setNamePrefix] = useState(initialNamePrefix);
  const [startingNumber, setStartingNumber] = useState(null);

  const formRef = useRef(null);
  const toastRef = useRef(null);

  const formName = ['general', 'samples'];

  // Relevant keys for quick-entry modal
  const sampleTypeKey = ['sample_type', 'material_type'];
  const firstKeys = ['sample_id_name', 'label', 'sample_description'];
  const inplacenessKey = 'inplaceness_of_sample';
  const orientedKey = 'oriented_sample';
  const lastKeys = ['sample_notes'];

  // Relevant fields for quick-entry modal
  const survey = getSurvey(formName);
  const choices = getChoices(formName);
  const firstKeysFields = firstKeys.map(k =>
    survey.find(f => f.name === k),
  );
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));

  useLayoutEffect(() => {
    console.log('ULE SampleModal []');
    return () => confirmLeavePage();
  }, [spot]);

  useEffect(() => {
    console.log('UE SampleModal [spot]', spot);
    if (preferences.prepend_spot_name_sample_name) {
      const spotName = modalVisible === MODAL_KEYS.SHORTCUTS.SAMPLE || !spot ? getNewSpotName()
        : spot?.properties?.name;
      setNamePrefix(spotName + initialNamePrefix);
    }

    if (preferences.sample_postfix_letter) {
      let postfixLetter = 'a';
      if (spot?.properties?.samples && !isEmpty(spot?.properties?.samples)) {
        postfixLetter = numToLetter(spot.properties.samples.length + 1);
        postfixLetter = postfixLetter.toLowerCase();
      }
      setNamePostfix(postfixLetter);
    }
    else if (preferences.restart_sample_num_each_spot) {
      let postfixNumber = 1;
      if (spot?.properties?.samples && !isEmpty(spot?.properties?.samples)) {
        postfixNumber = spot.properties?.samples?.length + 1;
      }
      postfixNumber = postfixNumber < 10 ? '0' + postfixNumber : postfixNumber;
      setNamePostfix(postfixNumber);
    }
    else {
      setStartingNumber(
        preferences.starting_sample_number
        || spot.properties?.samples?.length + 1
        || 1,
      );
    }
  }, [spot]);

  const confirmLeavePage = () => {
    if (formRef.current && formRef.current.dirty && modalVisible !== MODAL_KEYS.SHORTCUTS.SAMPLE) {
      const formCurrent = formRef.current;
      alert(
        'Unsaved Changes',
        'Would you like to save your sample before continuing?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: () => saveForm(formCurrent),
          },
        ],
        {cancelable: false},
      );
    }
  };

  const onCloseModalPressed = () => {
    if (choicesViewKey) setChoicesViewKey(null);
    else dispatch(setModalVisible({modal: null}));
  };

  const onOrientedButtonPress = (i) => {
    if (i === 0 && formRef.current?.values[orientedKey] === 'yes') {
      formRef.current?.setFieldValue(orientedKey, undefined);
    }
    else if (i === 0) formRef.current?.setFieldValue(orientedKey, 'yes');
    else if (i === 1 && formRef.current?.values[orientedKey] === 'no') {
      formRef.current?.setFieldValue(orientedKey, undefined);
    }
    else formRef.current?.setFieldValue(orientedKey, 'no');
  };

  const renderForm = (formProps) => {
    return (
      <>
        <MainButtons
          formName={formName}
          formProps={formProps}
          mainKeys={sampleTypeKey}
          setChoicesViewKey={setChoicesViewKey}
        />
        <Form
          {...{
            formName: formName,
            surveyFragment: firstKeysFields,
            ...formProps,
          }}
        />
        <FormSlider
          choices={choices}
          fieldKey={inplacenessKey}
          formProps={formProps}
          labels={['In Place', 'Float']}
          survey={survey}
        />
        <ButtonGroup
          buttonStyle={{padding: 5}}
          buttons={['Oriented', 'Unoriented']}
          containerStyle={{height: 40, borderRadius: 10}}
          onPress={onOrientedButtonPress}
          selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
          selectedIndex={
            formRef.current?.values[orientedKey] === 'yes'
              ? 0
              : formRef.current?.values[orientedKey] === 'no'
                ? 1
                : undefined
          }
          textStyle={{color: PRIMARY_TEXT_COLOR}}
        />
        <Form
          {...{
            formName: formName,
            surveyFragment: lastKeysFields,
            ...formProps,
          }}
        />
      </>
    );
  };

  const renderSubform = (formProps) => {
    const relevantFields = getRelevantFields(survey, choicesViewKey);
    return <Form {...{formName: formName, surveyFragment: relevantFields, ...formProps}}/>;
  };

  const saveForm = async (currentForm) => {
    try {
      setIsLoading(true);
      let newSample = currentForm.values;
      const date = new Date().toISOString();

      dispatch(setLoadingStatus({view: 'home', bool: true}));
      newSample.id = getNewId();
      newSample.collection_date = date;
      newSample.collection_time = date;

      if (modalVisible === MODAL_KEYS.SHORTCUTS.SAMPLE) {
        let samples = 'samples';
        let pointSetAtCurrentLocation = await setPointAtCurrentLocation();
        pointSetAtCurrentLocation.properties[samples] = [newSample];
        console.log('pointSetAtCurrentLocation', pointSetAtCurrentLocation);
        dispatch(updatedModifiedTimestampsBySpotsIds([pointSetAtCurrentLocation.properties.id]));
        dispatch(editedOrCreatedSpot(pointSetAtCurrentLocation));
        const toastMsg = 'Sample Saved!';
        const toastOptions = {duration: 2000, type: 'success', placement: 'top'};
        toastRef.current?.show(toastMsg, toastOptions);
        setIsLoading(false);
        await zoomToCurrentLocation();
      }
      else {
        Keyboard.dismiss();
        dispatch(setModalVisible({modal: null}));
        const samples = spot.properties?.samples
          ? [...spot.properties.samples, newSample]
          : [newSample];
        dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
        dispatch(editedSpotProperties({field: 'samples', value: samples}));
        const updatedPreferences = {
          ...preferences,
          starting_sample_number: namePostfix ? startingNumber : startingNumber + 1,
        };
        dispatch(updatedProject({field: 'preferences', value: updatedPreferences}));
        const toastMsg = 'Sample Saved!';
        const toastOptions = {duration: 2000, type: 'success', placement: 'top'};
        toast.show(toastMsg, toastOptions);
        setIsLoading(false);
      }
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      await currentForm.resetForm();

      if (newSample.sample_id_name) {
        const foundDuplicateName = await checkSampleName(newSample.sample_id_name);
        if (foundDuplicateName) {
          const toastMsg = 'Warning! Sample Name has Already Been Used.';
          const toastOptions = {duration: 2000, type: 'warning'};
          await sleep(2000);
          if (SMALL_SCREEN && toastRef) toastRef.current?.show(toastMsg, toastOptions);
          else toast.show(toastMsg, toastOptions);
          if (Platform.OS === 'web') await sleep(3000);
        }
      }
    }
    catch (err) {
      setIsLoading(false);
      console.error('Error saving Sample', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      const toastMsg = `Error Saving Sample! \n${err}`;
      const toastOptions = {duration: 2000, type: 'danger'};
      if (SMALL_SCREEN) toastRef.current?.show(toastMsg, toastOptions);
      else toast.show(toastMsg, toastOptions);
    }
  };

  const renderSampleMainContent = () => {
    return (
      <>
        <FlatList
          ListHeaderComponent={
            <Formik
              enableReinitialize={true}
              initialValues={{
                material_type: 'intact_rock',
                sample_type: 'individual_sample',
                sample_id_name: namePrefix + (namePostfix || (startingNumber < 10 ? '0' + startingNumber : startingNumber)),
                inplaceness_of_sample: '5___definitely',
              }}
              innerRef={formRef}
              onSubmit={values => console.log('Submitting form...', values)}>
              {formProps => (
                <View style={{flex: 1}}>
                  {choicesViewKey ? renderSubform(formProps) : renderForm(formProps)}
                </View>
              )}
            </Formik>
          }
          bounces={false}
        />
        {!choicesViewKey && <ActionButton isLoading={isLoading} onPress={() => saveForm(formRef.current)}/>}
      </>
    );
  };

  return (
    <ModalWrapper
      buttonTitleRight={choicesViewKey ? 'Done' : null}
      closeModal={onCloseModalPressed}
      onFooterButtonPress={onPress}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={true}
    >
      {renderSampleMainContent()}
      {SMALL_SCREEN && <Toast ref={toastRef}/>}
    </ModalWrapper>
  );
};

export default SampleModal;
