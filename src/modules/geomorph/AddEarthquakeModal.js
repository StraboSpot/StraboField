import React, {useEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {getNewUUID} from '../../shared/Helpers';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
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
          fieldKey={confidenceInFeatureKey}
          formProps={formProps}
          labels={['Low', 'High']}
          survey={survey}
        />
        <LittleSpacer/>
        <Form {...{formName: formName, surveyFragment: lastKeysFields, ...formProps}}/>
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
        closeModal={() => choicesViewKey ? setChoicesViewKey(null) : dispatch(setModalVisible({modal: null}))}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <FlatList
          ListHeaderComponent={
            <View style={{flex: 1}}>
              <Formik
                initialValues={{}}
                innerRef={formRef}
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
          bounces={false}
        />
        {!choicesViewKey && <ActionButton onPress={saveEarthquake} title={'Save Earthquake'}/>}
      </ModalWrapper>
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
