import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {Formik} from 'formik';
import Toast from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {getNewId, isEmpty, numToLetter} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR, SMALL_SCREEN} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import Modal from '../../shared/ui/modal/Modal';
import SaveButton from '../../shared/ui/SaveButton';
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
  const {getCurrentLocation, setPointAtCurrentLocation} = useMapLocation();

  const initialNamePrefix = preferences.sample_prefix || '';
  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [namePrefix, setNamePrefix] = useState(initialNamePrefix);
  const [namePostfix, setNamePostfix] = useState(null);
  const [startingNumber, setStartingNumber] = useState(null);
  const [currentLocation, setCurrentLocation] = useState({});
  const [collectionDate, setCollectionDate] = useState(null);

  const formRef = useRef(null);
  const toastRef = useRef();

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
    getCurrentLocation()
      .then((location) => {
        const date = new Date().toISOString();
        setCurrentLocation(location);
        setCollectionDate(date);
      });

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
          mainKeys={sampleTypeKey}
          formName={formName}
          setChoicesViewKey={setChoicesViewKey}
          formProps={formProps}
        />
        <Form
          {...{
            formName: formName,
            surveyFragment: firstKeysFields,
            ...formProps,
          }}
        />
        <FormSlider
          fieldKey={inplacenessKey}
          formProps={formProps}
          survey={survey}
          choices={choices}
          labels={['In Place', 'Float']}
        />
        <ButtonGroup
          selectedIndex={
            formRef.current?.values[orientedKey] === 'yes'
              ? 0
              : formRef.current?.values[orientedKey] === 'no'
                ? 1
                : undefined
          }
          onPress={onOrientedButtonPress}
          buttons={['Oriented', 'Unoriented']}
          containerStyle={{height: 40, borderRadius: 10}}
          buttonStyle={{padding: 5}}
          selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
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
      let newSample = currentForm.values;
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      newSample.id = getNewId();
      if (modalVisible === MODAL_KEYS.SHORTCUTS.SAMPLE) {
        let pointSetAtCurrentLocation = await setPointAtCurrentLocation();
        pointSetAtCurrentLocation = {
          ...pointSetAtCurrentLocation,
          properties: {
            ...pointSetAtCurrentLocation.properties,
            samples: [newSample],
          },
        };
        console.log('pointSetAtCurrentLocation', pointSetAtCurrentLocation);
        dispatch(updatedModifiedTimestampsBySpotsIds([pointSetAtCurrentLocation.properties.id]));
        dispatch(editedOrCreatedSpot(pointSetAtCurrentLocation));
        await zoomToCurrentLocation();
      }
      else {
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
      }
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      await currentForm.resetForm();

      if (newSample.sample_id_name) await checkSampleName(newSample.sample_id_name, toastRef);
    }
    catch (err) {
      console.error('Error saving Sample', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
  };

  const renderSampleMainContent = () => {
    return (
      <>
        <FlatList
          bounces={false}
          ListHeaderComponent={
            <Formik
              innerRef={formRef}
              initialValues={{
                material_type: 'intact_rock',
                sample_type: 'individual_sample',
                sample_id_name: namePrefix + (namePostfix || (startingNumber < 10 ? '0' + startingNumber : startingNumber)),
                inplaceness_of_sample: '5___definitely',
                longitude: currentLocation.longitude,
                latitude: currentLocation.latitude,
                collection_time: collectionDate,
                collection_date: collectionDate,
              }}
              onSubmit={values => console.log('Submitting form...', values)}
              enableReinitialize={true}>
              {formProps => (
                <View style={{flex: 1}}>
                  {choicesViewKey ? renderSubform(formProps) : renderForm(formProps)}
                </View>
              )}
            </Formik>
          }
        />
        {!choicesViewKey && <SaveButton
          title={'Save Sample'}
          onPress={() => saveForm(formRef.current)}
        />}
      </>
    );
  };

  return (
    <Modal
      closeModal={onCloseModalPressed}
      buttonTitleRight={choicesViewKey ? 'Done' : null}
      onPress={onPress}
    >

      {renderSampleMainContent()}
      {SMALL_SCREEN && <Toast ref={toastRef}/>}
    </Modal>
  );
};

export default SampleModal;
