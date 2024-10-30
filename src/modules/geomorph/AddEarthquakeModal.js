import React, {useEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {getNewUUID} from '../../shared/Helpers';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import Modal from '../../shared/ui/modal/Modal';
import SaveButton from '../../shared/ui/SaveButton';
import {Form, FormSlider, MainButtons, useForm} from '../form';
import MeasurementButtons from '../form/MeasurementButtons';
import MeasurementModal from '../form/MeasurementModal';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {PAGE_KEYS} from '../page/page.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const AddEarthquakeModal = ({onPress}) => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const [choicesViewKey, setChoicesViewKey] = useState(null);

  const formRef = useRef(null);
  const {getChoices, getRelevantFields, getSurvey, isRelevant, showErrors, validateForm} = useForm();

  const [isFaultOrientationModalVisible, setIsFaultOrientationModalVisible] = useState(false);
  const [isVectorMeasurementModalVisible, setIsVectorMeasurementModalVisible] = useState(false);
  const [measurementsGroupField, setMeasurementsGroupField] = useState({});

  const groupKey = 'general';
  const pageKey = PAGE_KEYS.EARTHQUAKES;
  const formName = [groupKey, pageKey];

  // Relevant keys for quick-entry modal
  const mainButtonsKeys1 = ['earthquake_feature', 'fault_type'];
  const mainButtonsKeys2 = ['movement', 'rupture_expression',
    'liquefaction_area_affected', 'fault_slip_meas', 'date_of_movement', 'time_of_movement', 'landslide_feat',
    'slide_type', 'material_type', 'area_affected', 'cause_of_damage', 'date_of_damage', 'time_of_damage',
    'utility_affected', 'facility_affected', 'damage_severity', 'mode_of_observation'];
  const confidenceInFeatureKey = 'confidence_in_feature';
  const lastKeys = ['diameter', 'height_of_material', 'max_vert_movement', 'dir_of_slope_mov',
    'displacement_amt', 'depth', 'max_drop_in_elevation', 'length_exposed_downslope', 'slip_preferred', 'slip_min',
    'slip_max', 'horiz_sep_pref', 'horiz_sep_min', 'horiz_sep_max', 'vert_sep_pref', 'vert_sep_min', 'vertical_sep_max',
    'slip_azimuth', 'heave_pref', 'heave_min', 'rupture_width_pref', 'rupture_width_min', 'rupture_width_max', 'notes'];

  const FAULT_ORIENTATION_KEYS = {
    group_fs5ba04: {
      strike: 'strike',
      dip_direction: 'azimuth_dip_dir',
      dip: 'dip',
      quality: 'meas_quality',
    },
  };

  const VECTOR_MEASUREMENT_KEYS = {
    group_bf6rc11: {
      trend: 'trend',
      plunge: 'plunge',
      quality: 'vector_meas_confidence',
    },
  };

  // Relevant fields for quick-entry modal
  const survey = getSurvey(formName);
  const choices = getChoices(formName);
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));

  useEffect(() => {
    console.log('UE AddEarthquakeModal []');
    return () => dispatch(setModalValues({}));
  }, []);

  const renderForm = (formProps) => {
    const mainButtonsKeysRelevant1 = mainButtonsKeys1.filter((k) => {
      const field = survey.find(f => f.name === k);
      return isRelevant(field, formProps.values);
    });
    const mainButtonsKeysRelevant2 = mainButtonsKeys2.filter((k) => {
      const field = survey.find(f => f.name === k);
      return isRelevant(field, formProps.values);
    });

    return (
      <>
        <LittleSpacer/>
        <MainButtons
          mainKeys={mainButtonsKeysRelevant1}
          formName={formName}
          setChoicesViewKey={setChoicesViewKey}
          formProps={formProps}
        />
        {formProps.values.earthquake_feature === 'fault_rupture' && (
          <MeasurementButtons
            formProps={formProps}
            measurementsKeys={FAULT_ORIENTATION_KEYS}
            setMeasurementsGroupField={setMeasurementsGroupField}
            setIsMeasurementsModalVisible={setIsFaultOrientationModalVisible}
            survey={survey}
          />
        )}
        <MainButtons
          mainKeys={mainButtonsKeysRelevant2}
          formName={formName}
          setChoicesViewKey={setChoicesViewKey}
          formProps={formProps}
        />
        {formProps.values.fault_slip_meas?.includes('vector_measurement') && (
          <MeasurementButtons
            formProps={formProps}
            measurementsKeys={VECTOR_MEASUREMENT_KEYS}
            setMeasurementsGroupField={setMeasurementsGroupField}
            setIsMeasurementsModalVisible={setIsVectorMeasurementModalVisible}
            survey={survey}
          />
        )}
        <LittleSpacer/>
        <FormSlider
          fieldKey={confidenceInFeatureKey}
          formProps={formProps}
          survey={survey}
          choices={choices}
          labels={['Low', 'High']}
        />
        <LittleSpacer/>
        <Form {...{formName: formName, surveyFragment: lastKeysFields, ...formProps}}/>
        {isFaultOrientationModalVisible && (
          <MeasurementModal
            measurementsGroup={FAULT_ORIENTATION_KEYS[measurementsGroupField.name]}
            measurementsGroupLabel={measurementsGroupField.label}
            formName={formName}
            formProps={formProps}
            setIsMeasurementModalVisible={setIsFaultOrientationModalVisible}
          />
        )}
        {isVectorMeasurementModalVisible && (
          <MeasurementModal
            measurementsGroup={VECTOR_MEASUREMENT_KEYS[measurementsGroupField.name]}
            measurementsGroupLabel={measurementsGroupField.label}
            formName={formName}
            formProps={formProps}
            setIsMeasurementModalVisible={setIsVectorMeasurementModalVisible}
          />
        )}
      </>
    );
  };

  const renderNotebookEarthquakeModal = () => {
    return (
      <Modal
        closeModal={() => choicesViewKey ? setChoicesViewKey(null) : dispatch(setModalVisible({modal: null}))}
        buttonTitleRight={choicesViewKey && 'Done'}
        onPress={onPress}
      >
        <FlatList
          bounces={false}
          ListHeaderComponent={
            <View style={{flex: 1}}>
              <Formik
                innerRef={formRef}
                initialValues={{}}
                onSubmit={values => console.log('Submitting form...', values)}
                validate={values => validateForm({formName: formName, values: values})}
                validateOnChange={false}
              >
                {formProps => (
                  <View style={{flex: 1}}>
                    {choicesViewKey ? renderSubform(formProps) : renderForm(formProps)}
                  </View>
                )}
              </Formik>
            </View>
          }
        />
        {!choicesViewKey && <SaveButton title={'Save Earthquake'} onPress={saveEarthquake}/>}
      </Modal>
    );
  };

  const renderSubform = (formProps) => {
    const relevantFields = getRelevantFields(survey, choicesViewKey);
    return (
      <Form {...{formName: [groupKey, pageKey], surveyFragment: relevantFields, ...formProps}}/>
    );
  };

  const saveEarthquake = async () => {
    try {
      await formRef.current.submitForm();
      const editedEarthquakeData = showErrors(formRef.current);
      console.log('Saving earthquake data to Spot ...');
      let editedEarthquakesData = spot.properties.earthquakes ? JSON.parse(
        JSON.stringify(spot.properties.earthquakes)) : [];
      editedEarthquakesData.push({...editedEarthquakeData, id: getNewUUID()});
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: pageKey, value: editedEarthquakesData}));
    }
    catch (err) {
      console.log('Error submitting form', err);
    }
  };

  return renderNotebookEarthquakeModal();
};

export default AddEarthquakeModal;
