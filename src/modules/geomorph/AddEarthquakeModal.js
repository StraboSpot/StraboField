import React, {useEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {
  CONFIDENCE_IN_FEATURE_KEY,
  EARTHQUAKE_FORM_NAME,
  EARTHQUAKE_GROUP_KEY,
  EARTHQUAKE_ORIENTATION_FIELDS,
  EARTHQUAKE_PAGE_KEY,
  FAULT_ORIENTATION_KEYS,
  LAST_KEYS,
  MAIN_BUTTONS_KEYS_1,
  MAIN_BUTTONS_KEYS_2,
  VECTOR_MEASUREMENT_KEYS,
} from './geomorph.constants';
import {getNewUUID} from '../../shared/helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {onOrientationChange} from '../compass/compass.helpers';
import {Form, FormikWrapper, FormSlider, MainButtons, useForm} from '../form';
import MeasurementButtons from '../form/MeasurementButtons';
import MeasurementModal from '../form/MeasurementModal';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const formName = EARTHQUAKE_FORM_NAME;
const groupKey = EARTHQUAKE_GROUP_KEY;
const pageKey = EARTHQUAKE_PAGE_KEY;

const AddEarthquakeModal = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getChoices, getRelevantFields, getSurvey, isRelevant, submitAndShowErrors} = useForm();

  /* Local State */

  const formRef = useRef(null);

  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [isFaultOrientationModalVisible, setIsFaultOrientationModalVisible] = useState(false);
  const [isFormInvalid, setIsFormInvalid] = useState(false);
  const [isVectorMeasurementModalVisible, setIsVectorMeasurementModalVisible] = useState(false);
  const [measurementsGroupField, setMeasurementsGroupField] = useState({});

  /* Derived Variables */

  const choices = getChoices(formName);
  const survey = getSurvey(formName);
  const LAST_KEYSFields = LAST_KEYS.map(k => survey.find(f => f.name === k));

  /* Side Effects */

  useEffect(() => {
    console.log('UE AddEarthquakeModal []');
    return () => dispatch(setModalValues({}));
  }, []);

  /* Event Handlers */

  // Entering a strike fills in the azimuth dip direction and the reverse
  const onNumberChange = (name, value) => onOrientationChange(formRef.current, name, value,
    {orientationFields: EARTHQUAKE_ORIENTATION_FIELDS});

  /* Logic Helpers */

  const closeModal = () => dispatch(setModalVisible({modal: null}));

  const saveEarthquake = async () => {
    try {
      const {values: editedEarthquakeData} = await submitAndShowErrors(formRef.current);
      console.log('Saving earthquake data to Spot ...');
      let editedEarthquakesData = spot.properties.earthquakes
        ? JSON.parse(JSON.stringify(spot.properties.earthquakes))
        : [];
      editedEarthquakesData.push({...editedEarthquakeData, id: getNewUUID()});
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: pageKey, value: editedEarthquakesData}));
      if (SMALL_SCREEN) closeModal();
    }
    catch (err) {
      console.error('Error submitting form', err);
    }
  };

  /* Render Functions */

  const renderForm = (formProps) => {
    const mainButtonsKeysRelevant1 = MAIN_BUTTONS_KEYS_1.filter((k) => {
      const field = survey.find(f => f.name === k);
      return isRelevant(field, formProps.values);
    });
    const mainButtonsKeysRelevant2 = MAIN_BUTTONS_KEYS_2.filter((k) => {
      const field = survey.find(f => f.name === k);
      return isRelevant(field, formProps.values);
    });

    return (
      <>
        <LittleSpacer/>
        <MainButtons
          formName={formName}
          formProps={formProps}
          mainKeys={mainButtonsKeysRelevant1}
          setChoicesViewKey={setChoicesViewKey}
        />
        {formProps.values.earthquake_feature === 'fault_rupture' && (
          <MeasurementButtons
            formProps={formProps}
            measurementsKeys={FAULT_ORIENTATION_KEYS}
            setIsMeasurementsModalVisible={setIsFaultOrientationModalVisible}
            setMeasurementsGroupField={setMeasurementsGroupField}
            survey={survey}
          />
        )}
        <MainButtons
          formName={formName}
          formProps={formProps}
          mainKeys={mainButtonsKeysRelevant2}
          setChoicesViewKey={setChoicesViewKey}
        />
        {formProps.values.fault_slip_meas?.includes('vector_measurement') && (
          <MeasurementButtons
            formProps={formProps}
            measurementsKeys={VECTOR_MEASUREMENT_KEYS}
            setIsMeasurementsModalVisible={setIsVectorMeasurementModalVisible}
            setMeasurementsGroupField={setMeasurementsGroupField}
            survey={survey}
          />
        )}
        <LittleSpacer/>
        <FormSlider
          choices={choices}
          fieldKey={CONFIDENCE_IN_FEATURE_KEY}
          formProps={formProps}
          labels={['Low', 'High']}
          survey={survey}
        />
        <LittleSpacer/>
        <Form {...formProps} formName={formName} surveyFragment={LAST_KEYSFields}/>
        {isFaultOrientationModalVisible && (
          <MeasurementModal
            formName={formName}
            formProps={formProps}
            measurementsGroup={FAULT_ORIENTATION_KEYS[measurementsGroupField.name]}
            measurementsGroupLabel={measurementsGroupField.label}
            setIsMeasurementModalVisible={setIsFaultOrientationModalVisible}
          />
        )}
        {isVectorMeasurementModalVisible && (
          <MeasurementModal
            formName={formName}
            formProps={formProps}
            measurementsGroup={VECTOR_MEASUREMENT_KEYS[measurementsGroupField.name]}
            measurementsGroupLabel={measurementsGroupField.label}
            setIsMeasurementModalVisible={setIsVectorMeasurementModalVisible}
          />
        )}
      </>
    );
  };

  const renderNotebookEarthquakeModal = () => {
    return (
      <ModalWrapper
        buttonTitleRight={choicesViewKey && 'Done'}
        closeModal={() => choicesViewKey ? setChoicesViewKey(null) : closeModal()}
        disabled={isFormInvalid}
        onActionPressed={saveEarthquake}
        showActionButton={!choicesViewKey}
        showCancelButton={false}
        showCloseButton
      >
        <FlatList
          ListHeaderComponent={
            <View style={{flex: 1}}>
              <FormikWrapper
                formName={formName}
                initialValues={{}}
                innerRef={formRef}
                setIsFormInvalid={setIsFormInvalid}
              >
                {formProps => (
                  <View style={{flex: 1}}>
                    {choicesViewKey ? renderSubform(formProps) : renderForm(formProps)}
                  </View>
                )}
              </FormikWrapper>
            </View>
          }
          bounces={false}
        />
      </ModalWrapper>
    );
  };

  const renderSubform = (formProps) => {
    const relevantFields = getRelevantFields(survey, choicesViewKey);
    return (
      <Form
        {...formProps}
        formName={[groupKey, pageKey]}
        onNumberChange={onNumberChange}
        surveyFragment={relevantFields}
      />
    );
  };

  /* View */

  return renderNotebookEarthquakeModal();
};

export default AddEarthquakeModal;
