import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import AddLine from './AddLine';
import AddManualMeasurements from './AddManualMeasurements';
import AddPlane from './AddPlane';
import {
  LINEAR_COMPASS_FIELDS,
  MEASUREMENT_GROUP_KEY,
  MEASUREMENT_KEYS,
  MEASUREMENT_TYPES,
  PLANAR_COMPASS_FIELDS,
  TOAST_OPTIONS,
} from './measurements.constants';
import {equalsIgnoreOrder, getLinearTemplates, getPlanarTemplates} from './measurements.helpers';
import commonStyles from '../../shared/common.styles';
import {getNewUUID, isEmpty} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR, SMALL_SCREEN} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui/';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SliderBar from '../../shared/ui/SliderBar';
import Compass from '../compass/Compass';
import {setCompassMeasurementTypes} from '../compass/compass.slice';
import compassStyles from '../compass/compass.styles';
import {Form, FormikWrapper, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import useDeviceOrientation from '../home/useDeviceOrientation';
import useMapLocation from '../maps/view/useMapLocation';
import {MODAL_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties, setSelectedAttributes} from '../spots/spots.slice';
import TemplatesNotebook from '../templates/TemplatesNotebook';
import {setUserData} from '../user/userProfile.slice';

const AddMeasurementModal = ({onPress}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);
  const defaultManualMeasurement = useSelector(state => state.user.default_manual_measurement);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);
  const templates = useSelector(state => state.project.project?.templates) || {};

  const {lockToPortrait, unlockOrientation} = useDeviceOrientation();
  const {getChoices, getRelevantFields, getSurvey, submitAndShowErrors, validateForm} = useForm();
  const {setPointAtCurrentLocation} = useMapLocation();
  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);
  const prevValuesRef = useRef({compassMeasurementTypes: null, templates: null});

  const [assocChoicesViewKey, setAssocChoicesViewKey] = useState(null);
  const [choices, setChoices] = useState({});
  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [initialValues, setInitialValues] = useState({id: getNewUUID()});
  const [isFormInvalid, setIsFormInvalid] = useState(false);
  const [isShowTemplates, setIsShowTemplates] = useState(false);
  const [measurementTypeForForm, setMeasurementTypeForForm] = useState(null);
  const [relevantTemplates, setRelevantTemplates] = useState([]);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(6);
  const [survey, setSurvey] = useState({});

  /* Derived Variables */

  // Is an attitude already selected (like when adding an associated measurement to an already existing attitude)
  const isSelectedAttitude = !isEmpty(selectedAttributes) && selectedAttributes?.length > 0;

  // Web has no Compass input and no toggle to leave Manual, so Manual is always on there whatever the preference
  // says. Everywhere else follow the shared user preference, so this toggle and the one in User Conventions stay in
  // sync, defaulting to Compass while it is unset.
  const isManualMeasurement = Platform.OS === 'web' || (defaultManualMeasurement ?? false);
  const setIsManualMeasurement = value => dispatch(setUserData({default_manual_measurement: value}));

  /* Side Effects */

  useEffect(() => {
    console.log('UE AddMeasurementModal []');
    return () => {
      dispatch(setModalValues({}));
      if (!SMALL_SCREEN && Platform.OS !== 'web') unlockOrientation();
    };
  }, []);

  // Only Compass input needs the screen locked to portrait; Manual entry does not, so don't fire the lock for it
  useEffect(() => {
    if (SMALL_SCREEN || Platform.OS === 'web') return;
    if (isManualMeasurement) {
      unlockOrientation();
    }
    else {
      lockToPortrait();
      toast.show('Screen orientation LOCKED', {...TOAST_OPTIONS, type: 'lock'});
    }
  }, [isManualMeasurement]);

  useLayoutEffect(() => {
    console.log('UE AddMeasurementModal [compassMeasurementTypes, templates]', compassMeasurementTypes, templates);
    const prev = prevValuesRef.current;
    if (equalsIgnoreOrder(prev.compassMeasurementTypes || [], compassMeasurementTypes)
      && JSON.stringify(prev.templates) === JSON.stringify(templates)
    ) return;
    prevValuesRef.current = {compassMeasurementTypes, templates};
    const typeObj = MEASUREMENT_TYPES.find(t => equalsIgnoreOrder(t.compass_toggles, compassMeasurementTypes));
    setSelectedTypeIndex(MEASUREMENT_TYPES.findIndex(t => t.key === typeObj.key));
    // Get the templates for the measurement type
    // (We're not using templates if there is already a selected attitude, like when adding an associated
    // measurement to an existing attitude, so default to [] in that case)
    const gotRelevantTemplates = !isSelectedAttitude && templates.measurementTemplates
      && templates.useMeasurementTemplates && templates.activeMeasurementTemplates
      && templates.activeMeasurementTemplates.filter(t => typeObj.form_keys.includes(t.values?.type || t.type)) || [];
    setRelevantTemplates(gotRelevantTemplates);
    let initialValuesTemp = {
      id: getNewUUID(),
      type: typeObj.key === MEASUREMENT_KEYS.PLANAR_LINEAR ? MEASUREMENT_KEYS.PLANAR : typeObj.key,
    };
    // A single template of a kind fills the form in so it can still be edited. Several of a kind each become
    // their own measurement on save, so there is no one set of values to show and nothing is filled in.
    if (typeObj.key === MEASUREMENT_KEYS.PLANAR_LINEAR) {
      const planarTemplates = getPlanarTemplates(gotRelevantTemplates);
      const linearTemplates = getLinearTemplates(gotRelevantTemplates);
      if (planarTemplates.length === 1) initialValuesTemp = {...initialValuesTemp, ...planarTemplates[0].values};
      if (linearTemplates.length === 1) {
        if (!initialValuesTemp.associated_orientation) initialValuesTemp.associated_orientation = [];
        initialValuesTemp.associated_orientation[0] = {
          ...linearTemplates[0].values,
          id: getNewUUID(),
          type: MEASUREMENT_KEYS.LINEAR,
        };
      }
    }
    else if (gotRelevantTemplates.length === 1) {
      initialValuesTemp = {...initialValuesTemp, ...gotRelevantTemplates[0].values};
    }
    setInitialValues(initialValuesTemp);
    setMeasurementTypeForForm(initialValuesTemp.type);
    const formName = [MEASUREMENT_GROUP_KEY, initialValuesTemp.type];
    formRef.current?.setStatus({formName: formName});
    setSurvey(getSurvey(formName));
    setChoices(getChoices(formName));
  }, [compassMeasurementTypes, templates]);

  /* Event Handlers */

  const onCloseButton = () => {
    if (choicesViewKey || assocChoicesViewKey) {
      setChoicesViewKey(null);
      setAssocChoicesViewKey(null);
    }
    else if (isShowTemplates) setIsShowTemplates(false);
    else dispatch(setModalVisible({modal: null}));
  };

  const onMeasurementTypePress = (i) => {
    if (i !== selectedTypeIndex) {
      setSelectedTypeIndex(i);
      formRef.current?.resetForm();
      const typeObj = MEASUREMENT_TYPES[i];
      setMeasurementTypeForForm(typeObj.form_keys[0]);
      const formType = typeObj.form_keys[0];
      const formName = [MEASUREMENT_GROUP_KEY, formType];
      setSurvey(getSurvey(formName));
      setChoices(getChoices(formName));
      dispatch(setCompassMeasurementTypes(typeObj.compass_toggles));
    }
  };

  const onSetChoicesAssocViewKey = (key) => {
    setChoicesViewKey(null);
    setAssocChoicesViewKey(key);
  };

  const onSetChoicesViewKey = (key) => {
    setChoicesViewKey(key);
    setAssocChoicesViewKey(null);
  };

  /* Logic Helpers */

  // A save cleans the values against the survey it was validated with, which reaches only the top level, so the
  // associated orientation nested under associated_orientation[0] would keep the text its numbers were typed as.
  // Clean it against the linear survey, the same one validateMeasurement collects its errors from.
  const cleanAssociatedOrientation = (values) => {
    const associatedValues = values.associated_orientation?.[0];
    if (isEmpty(associatedValues)) return values;
    const {values: cleanedAssociatedValues} = validateForm({
      formName: [MEASUREMENT_GROUP_KEY, MEASUREMENT_KEYS.LINEAR],
      values: associatedValues,
    });
    return {...values, associated_orientation: [cleanedAssociatedValues]};
  };

  const saveMeasurement = async () => {
    const typeKey = MEASUREMENT_TYPES[selectedTypeIndex]
    && MEASUREMENT_TYPES[selectedTypeIndex].key === MEASUREMENT_KEYS.PLANAR_LINEAR ? MEASUREMENT_KEYS.PLANAR_LINEAR
      : measurementTypeForForm;
    // If plane with associated line label the line with its own label, falling back to the plane's
    if (typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR) {
      const {associated_orientation: associatedOrientation, label} = formRef.current.values;
      const lineLabel = associatedOrientation?.[0]?.label || label;
      if (lineLabel) formRef.current.setFieldValue('associated_orientation[0].label', lineLabel);
    }
    try {
      // The ref, not the bag: the compass writes its reading and saves in the same tick
      let {values: editedMeasurementData} = await submitAndShowErrors(formRef);
      editedMeasurementData = cleanAssociatedOrientation(editedMeasurementData);
      const spotToUpdate = modalVisible === MODAL_KEYS.SHORTCUTS.MEASUREMENT ? await setPointAtCurrentLocation() : spot;
      let editedMeasurementsData = spotToUpdate.properties.orientation_data
        ? JSON.parse(JSON.stringify(spotToUpdate.properties.orientation_data)) : [];

      // If already a measurement but adding a new associated measurement
      if (isSelectedAttitude) {
        const newAssocMeasurement = JSON.parse(JSON.stringify(editedMeasurementData));
        editedMeasurementData = JSON.parse(JSON.stringify(selectedAttributes[0]));
        if (!editedMeasurementData.associated_orientation) editedMeasurementData.associated_orientation = [];
        editedMeasurementData.associated_orientation.push(newAssocMeasurement);
      }
      // If adding planar with an associated measurement from the Quick Entry Modal
      else if (editedMeasurementData.associated_orientation) {
        editedMeasurementData.associated_orientation[0].id = getNewUUID();
        editedMeasurementData.associated_orientation[0].type = MEASUREMENT_KEYS.LINEAR;
      }

      // If multiple templates then make all linear measurements associated to every planar and tabular measurement
      if (relevantTemplates.length > 1) {
        if (typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR || isSelectedAttitude) {
          let planarTabularTemplates = getPlanarTemplates(relevantTemplates);
          let linearTemplates = getLinearTemplates(relevantTemplates);
          // If already a measurement but adding a new associated measurements with multiple templates
          // NOTE Right now the code in the first 'If' below is unreachable as relevantTemplates are always
          // empty if there is a selectedAttitude
          if (isSelectedAttitude) {
            const newAssocMeasurement = editedMeasurementData.associated_orientation.splice(-1, 1)[0];
            planarTabularTemplates.forEach((t) => {
              editedMeasurementData.associated_orientation.push(
                {...t.values, ...newAssocMeasurement, id: getNewUUID()});
            });
            linearTemplates.forEach((t) => {
              editedMeasurementData.associated_orientation.push(
                {...t.values, ...newAssocMeasurement, id: getNewUUID()});
            });
            editedMeasurementsData = editedMeasurementsData.filter(d => d.id !== editedMeasurementData.id);
            editedMeasurementsData.push(editedMeasurementData);
          }
          // If an associated measurement from the Quick Entry Modal with multiple templates
          else {
            const enteredLine = editedMeasurementData.associated_orientation?.[0];
            if (planarTabularTemplates.length === 0) planarTabularTemplates = [editedMeasurementData];
            // Without linear templates the one entered line is associated to every planar measurement
            if (linearTemplates.length === 0) linearTemplates = enteredLine ? [enteredLine] : [];
            planarTabularTemplates.forEach((t) => {
              const associatedLines = linearTemplates.map(lT => ({...lT.values, ...enteredLine, id: getNewUUID()}));
              const measurement = {...t.values, ...editedMeasurementData, id: getNewUUID()};
              // A planar template can carry a line of its own, so clear it when there is none to attach
              if (isEmpty(associatedLines)) delete measurement.associated_orientation;
              else measurement.associated_orientation = associatedLines;
              editedMeasurementsData.push(measurement);
            });
          }
        }
        else {
          relevantTemplates.forEach(
            t => editedMeasurementsData.push({...t.values, ...editedMeasurementData, id: getNewUUID()}));
        }
        console.log('editedMeasurementData', editedMeasurementsData);
        dispatch(updatedModifiedTimestampsBySpotsIds([spotToUpdate.properties.id]));
        dispatch(editedSpotProperties({field: 'orientation_data', value: editedMeasurementsData}));
      }
      else {
        if (isSelectedAttitude) {
          editedMeasurementsData = editedMeasurementsData.filter(d => d.id !== editedMeasurementData.id);
          editedMeasurementsData.push(editedMeasurementData);
        }
        else editedMeasurementsData.push({...editedMeasurementData, id: getNewUUID()});
        console.log('editedMeasurementData', editedMeasurementData);
        console.log('Saving Measurement data to Spot ...', editedMeasurementsData);
        dispatch(updatedModifiedTimestampsBySpotsIds([spotToUpdate.properties.id]));
        dispatch(editedSpotProperties({field: 'orientation_data', value: editedMeasurementsData}));
      }
      if (isSelectedAttitude) {
        dispatch(setSelectedAttributes([editedMeasurementData]));
        onCloseButton();
      }
      toast.show('Measurement Saved!', {type: 'success', duration: 2000});
      SMALL_SCREEN && dispatch(setModalVisible({modal: null}));
    }
    catch (err) {
      console.error('Error submitting form', err);
    }
  };

  const setMeasurements = (data) => {
    const typeKey = MEASUREMENT_TYPES[selectedTypeIndex]
    && MEASUREMENT_TYPES[selectedTypeIndex].key === MEASUREMENT_KEYS.PLANAR_LINEAR ? MEASUREMENT_KEYS.PLANAR_LINEAR
      : measurementTypeForForm;
    const compassFields = measurementTypeForForm === MEASUREMENT_KEYS.PLANAR ? PLANAR_COMPASS_FIELDS
      : LINEAR_COMPASS_FIELDS;
    compassFields.forEach((compassFieldKey) => {
      formRef.current.setFieldValue(compassFieldKey,
        isEmpty(data?.[compassFieldKey]) ? undefined : data?.[compassFieldKey]);
    });
    if (typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR) {
      LINEAR_COMPASS_FIELDS.forEach((compassFieldKey) => {
        formRef.current.setFieldValue('associated_orientation[0]' + [compassFieldKey],
          isEmpty(data?.[compassFieldKey]) ? undefined : data?.[compassFieldKey]);
      });
    }
    saveMeasurement().catch(console.error);
  };

  // An associated orientation is nested under associated_orientation[0] and its fields are named with that path,
  // so validating the planar survey against the top-level values misses it entirely. Validate it against the
  // linear survey and key its errors to that same path, so they show inline and block the save — without this an
  // out-of-range trend/plunge/rake or a missing required other_feature saves silently.
  const validateMeasurement = (formName, values) => {
    const {errors} = validateForm({formName: formName, values: values});
    const associatedValues = values.associated_orientation?.[0];
    if (isEmpty(associatedValues)) return errors;
    const {errors: associatedErrors} = validateForm({
      formName: [MEASUREMENT_GROUP_KEY, MEASUREMENT_KEYS.LINEAR],
      values: associatedValues,
    });
    return Object.entries(associatedErrors).reduce(
      (acc, [key, message]) => ({...acc, ['associated_orientation[0].' + key]: message}), errors);
  };

  /* Render Functions */

  const renderForm = (formProps) => {
    const assocFormName = [MEASUREMENT_GROUP_KEY, 'linear_orientation'];
    const assocSurvey = getSurvey(assocFormName);
    const assocChoices = getChoices(assocFormName);
    const typeKey = MEASUREMENT_TYPES[selectedTypeIndex]
    && MEASUREMENT_TYPES[selectedTypeIndex].key === MEASUREMENT_KEYS.PLANAR_LINEAR ? MEASUREMENT_KEYS.PLANAR_LINEAR
      : measurementTypeForForm;
    return (
      <>
        {!isShowTemplates && !isSelectedAttitude && (
          <ButtonGroup
            buttonStyle={{padding: 5}}
            buttons={Object.values(MEASUREMENT_TYPES).map(t => t.add_title)}
            containerStyle={{height: 40, borderRadius: 10}}
            onPress={onMeasurementTypePress}
            selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
            selectedIndex={selectedTypeIndex}
            textStyle={{color: PRIMARY_TEXT_COLOR}}
          />
        )}
        {!isSelectedAttitude && (
          <TemplatesNotebook
            isShowTemplates={isShowTemplates}
            setIsShowTemplates={bool => setIsShowTemplates(bool)}
            typeKey={typeKey}
          />
        )}
        {!isShowTemplates && (
          <>
            {Platform.OS !== 'web' && (
              <>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', padding: 5}}>
                  <Text style={{}}>Compass</Text>
                  <SwitchWrapper onValueChange={value => setIsManualMeasurement(value)} value={isManualMeasurement}/>
                  <Text style={{}}>Manual</Text>
                </View>
              </>

            )}
            {isManualMeasurement ? (
              <AddManualMeasurements formProps={formProps} formRefCurrent={formRef.current} measurementType={typeKey}/>
            ) : (
              <>
                <Compass
                  formValues={formProps.values}
                  setMeasurements={setMeasurements}
                  sliderValue={sliderValue}
                />
                <View style={compassStyles.sliderContainer}>
                  <Text style={{...commonStyles.listItemTitle, fontWeight: 'bold'}}>Quality of Measurement</Text>
                  <SliderBar
                    labels={['Low', '', '', '', 'High', 'N/R']}
                    maximumValue={6}
                    minimumValue={1}
                    onSlidingComplete={setSliderValue}
                    step={1}
                    value={sliderValue}
                  />
                </View>
              </>
            )}
            {measurementTypeForForm === MEASUREMENT_KEYS.PLANAR
              && getPlanarTemplates(relevantTemplates).length <= 1 && (
                <>
                  <AddPlane
                    choices={choices}
                    formName={[MEASUREMENT_GROUP_KEY, MEASUREMENT_KEYS.PLANAR]}
                    formProps={formProps}
                    isManualMeasurement={isManualMeasurement}
                    setChoicesViewKey={onSetChoicesViewKey}
                    survey={survey}
                  />
                </>
              )}
            {(measurementTypeForForm === MEASUREMENT_KEYS.LINEAR || typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR)
              && getLinearTemplates(relevantTemplates).length <= 1 && (
                <>
                  <AddLine
                    choices={assocChoices}
                    formName={[MEASUREMENT_GROUP_KEY, MEASUREMENT_KEYS.LINEAR]}
                    formProps={formProps}
                    isManualMeasurement={isManualMeasurement}
                    isPlanarLinear={typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR}
                    setChoicesViewKey={typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR ? onSetChoicesAssocViewKey
                      : onSetChoicesViewKey}
                    survey={assocSurvey}
                  />
                </>
              )}
          </>
        )}
      </>
    );
  };

  const renderMeasurementModalContent = () => {
    const formName = [MEASUREMENT_GROUP_KEY, measurementTypeForForm];
    return (
      <ModalWrapper
        buttonTitleRight={(choicesViewKey || assocChoicesViewKey) ? 'Done' : isShowTemplates ? '' : null}
        closeModal={onCloseButton}
        disabled={isFormInvalid}
        onActionPressed={saveMeasurement}
        onFooterButtonPress={onPress}
        overlayStyleOverride={{height: '80%'}}
        showActionButton={!choicesViewKey && !assocChoicesViewKey && !isShowTemplates && isManualMeasurement}
        showCancelButton={false}
        showCloseButton
      >
        <>
          {measurementTypeForForm && (
            <FlatList
              ListHeaderComponent={
                <FormikWrapper
                  enableReinitialize={true}
                  formName={formName}
                  initialValues={initialValues}
                  innerRef={formRef}
                  setIsFormInvalid={setIsFormInvalid}
                  validate={values => validateMeasurement(formName, values)}
                >
                  {formProps => choicesViewKey ? renderSubform(formProps)
                    : assocChoicesViewKey ? renderSubformAssoc(formProps) : renderForm(formProps)}
                </FormikWrapper>
              }
              bounces={false}
              listKey={'form'}
            />
          )}
        </>
      </ModalWrapper>
    );
  };

  const renderSubform = (formProps) => {
    let relevantFields = getRelevantFields(survey, choicesViewKey);
    if (choicesViewKey === 'feature_type') {
      relevantFields = survey.filter(f => f.name === choicesViewKey || f.name === 'other_feature');
    }
    return <Form {...formProps} formName={formProps.status.formName} surveyFragment={relevantFields}/>;
  };

  const renderSubformAssoc = (formProps) => {
    const assocFormName = [MEASUREMENT_GROUP_KEY, 'linear_orientation'];
    const assocSurvey = getSurvey(assocFormName);
    let relevantFields = getRelevantFields(assocSurvey, assocChoicesViewKey);
    if (assocChoicesViewKey === 'feature_type') {
      relevantFields = assocSurvey.filter(f => f.name === assocChoicesViewKey || f.name === 'other_feature');
    }
    return (
      <Form
        {...formProps}
        formName={assocFormName}
        subkey={'associated_orientation'}
        surveyFragment={relevantFields}
      />
    );
  };

  /* View */

  return renderMeasurementModalContent();
};

export default AddMeasurementModal;
