import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {Formik} from 'formik';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import AddLine from './AddLine';
import AddManualMeasurements from './AddManualMeasurements';
import AddPlane from './AddPlane';
import {MEASUREMENT_KEYS, MEASUREMENT_TYPES} from './measurements.constants';
import commonStyles from '../../shared/common.styles';
import {getNewUUID, isEmpty} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR, SMALL_SCREEN} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui/';
import OverlayWrapper from '../../shared/ui/modal/OverlayWrapper';
import SaveButton from '../../shared/ui/SaveButton';
import SliderBar from '../../shared/ui/SliderBar';
import Compass from '../compass/Compass';
import {setCompassMeasurementTypes} from '../compass/compass.slice';
import compassStyles from '../compass/compass.styles';
import {Form, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import useDeviceOrientation from '../home/useDeviceOrientation';
import useMapLocation from '../maps/useMapLocation';
import {MODAL_KEYS} from '../page/page.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties, setSelectedAttributes} from '../spots/spots.slice';
import Templates from '../templates/Templates';

const AddMeasurementModal = ({onPress}) => {
  const dispatch = useDispatch();
  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);
  const templates = useSelector(state => state.project.project?.templates) || {};

  const [assocChoicesViewKey, setAssocChoicesViewKey] = useState(null);
  const [choices, setChoices] = useState({});
  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [initialValues, setInitialValues] = useState({id: getNewUUID()});
  const [isManualMeasurement, setIsManualMeasurement] = useState(Platform.OS === 'web');
  const [isShowTemplates, setIsShowTemplates] = useState(false);
  const [measurementTypeForForm, setMeasurementTypeForForm] = useState(null);
  const [relevantTemplates, setRelevantTemplates] = useState([]);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [survey, setSurvey] = useState({});
  const [sliderValue, setSliderValue] = useState(6);

  const {getChoices, getRelevantFields, getSurvey, showErrors, validateForm} = useForm();
  const {setPointAtCurrentLocation} = useMapLocation();
  const {lockToPortrait, unlockOrientation} = useDeviceOrientation();
  const toast = useToast();

  const toastOptions = {
    duration: 1000,
    placement: 'top',
  };

  const formRef = useRef(null);
  const prevValuesRef = useRef({compassMeasurementTypes: null, templates: null});

  const groupKey = 'measurement';
  // Is an attitude already selected (like when adding an associated measurement to an already existing attitude)
  const isSelectedAttitude = !isEmpty(selectedAttributes) && selectedAttributes?.length > 0;

  useEffect(() => {
    console.log('UE AddMeasurementModal []');
    if (!SMALL_SCREEN && Platform.OS !== 'web') {
      lockToPortrait();
      toast.show('Screen orientation LOCKED', {...toastOptions, type: 'lock'});
    }
    return () => {
      dispatch(setModalValues({}));
      if (!SMALL_SCREEN && Platform.OS !== 'web') unlockOrientation();
    };
  }, []);

  useLayoutEffect(() => {
    console.log('UE AddMeasurementModal [compassMeasurementTypes, templates]', compassMeasurementTypes, templates);

    const prev = prevValuesRef.current;

    if (
      equalsIgnoreOrder(prev.compassMeasurementTypes || [], compassMeasurementTypes) &&
      JSON.stringify(prev.templates) === JSON.stringify(templates)
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

    // Set the initial form values if not multiple templates
    if (gotRelevantTemplates.length <= 1 || (typeObj.key === MEASUREMENT_KEYS.PLANAR_LINEAR
      && getPlanarTemplates(gotRelevantTemplates).length <= 1
      || getLinearTemplates(gotRelevantTemplates).length <= 1)) {
      if (typeObj.key === MEASUREMENT_KEYS.PLANAR_LINEAR) {
        if (getPlanarTemplates(gotRelevantTemplates).length === 1) {
          initialValuesTemp = {...initialValuesTemp, ...getPlanarTemplates(gotRelevantTemplates)[0].values};
        }
        if (getLinearTemplates(gotRelevantTemplates).length === 1) {
          if (!initialValuesTemp.associated_orientation) initialValuesTemp.associated_orientation = [];
          initialValuesTemp.associated_orientation[0] = {
            ...getLinearTemplates(gotRelevantTemplates)[0].values,
            id: getNewUUID(),
            type: MEASUREMENT_KEYS.LINEAR,
          };
        }
      }
      else if (gotRelevantTemplates.length === 1) {
        initialValuesTemp = {...initialValuesTemp, ...gotRelevantTemplates[0].values};
      }
    }
    setInitialValues(initialValuesTemp);
    setMeasurementTypeForForm(initialValuesTemp.type);
    const formName = [groupKey, initialValuesTemp.type];
    formRef.current?.setStatus({formName: formName});
    setSurvey(getSurvey(formName));
    setChoices(getChoices(formName));

  }, [compassMeasurementTypes, templates]);

  const equalsIgnoreOrder = (a, b) => {
    if (a.length !== b.length) return false;
    const uniqueValues = new Set([...a, ...b]);
    for (const v of uniqueValues) {
      const aCount = a.filter(e => e === v).length;
      const bCount = b.filter(e => e === v).length;
      if (aCount !== bCount) return false;
    }
    return true;
  };

  const getPlanarTemplates = templatesToFilter => templatesToFilter.filter(
    t => t.values?.type === 'planar_orientation' || t.values?.type === 'tabular_orientation' || t.type === 'planar_orientation');

  const getLinearTemplates = templatesToFilter => templatesToFilter.filter(
    t => t.values?.type === 'linear_orientation' || t.type === 'linear_orientation');

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
      const formName = [groupKey, formType];
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

  const renderForm = (formProps) => {
    const assocFormName = [groupKey, 'linear_orientation'];
    const assocSurvey = getSurvey(assocFormName);
    const assocChoices = getChoices(assocFormName);
    let assocFormProps = JSON.parse(JSON.stringify(formProps));
    assocFormProps.values = {};
    const typeKey = MEASUREMENT_TYPES[selectedTypeIndex]
    && MEASUREMENT_TYPES[selectedTypeIndex].key === MEASUREMENT_KEYS.PLANAR_LINEAR ? MEASUREMENT_KEYS.PLANAR_LINEAR
      : measurementTypeForForm;
    return (
      <>
        {!isShowTemplates && !isSelectedAttitude && (
          <ButtonGroup
            selectedIndex={selectedTypeIndex}
            onPress={onMeasurementTypePress}
            buttons={Object.values(MEASUREMENT_TYPES).map(t => t.add_title)}
            containerStyle={{height: 40, borderRadius: 10}}
            buttonStyle={{padding: 5}}
            selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
            textStyle={{color: PRIMARY_TEXT_COLOR}}
          />
        )}
        {!isSelectedAttitude && (
          <Templates
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
            {isManualMeasurement ? <AddManualMeasurements formProps={formProps} measurementType={typeKey}/>
              : (
                <>
                  <Compass
                    setMeasurements={setMeasurements}
                    formValues={formProps.values}
                    sliderValue={sliderValue}
                  />
                  <View style={compassStyles.sliderContainer}>
                    <Text style={{...commonStyles.listItemTitle, fontWeight: 'bold'}}>Quality of Measurement</Text>
                    <SliderBar
                      onSlidingComplete={setSliderValue}
                      value={sliderValue}
                      step={1}
                      maximumValue={6}
                      minimumValue={1}
                      labels={['Low', '', '', '', 'High', 'N/R']}
                    />
                  </View>
                </>
              )
            }
            {measurementTypeForForm === MEASUREMENT_KEYS.PLANAR
              && getPlanarTemplates(relevantTemplates).length <= 1 && (
                <>
                  <AddPlane
                    survey={survey}
                    choices={choices}
                    setChoicesViewKey={onSetChoicesViewKey}
                    formName={[groupKey, MEASUREMENT_KEYS.PLANAR]}
                    formProps={formProps}
                    isManualMeasurement={isManualMeasurement}
                  />
                </>
              )}
            {(measurementTypeForForm === MEASUREMENT_KEYS.LINEAR || typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR)
              && getLinearTemplates(relevantTemplates).length <= 1 && (
                <>
                  <AddLine
                    survey={assocSurvey}
                    choices={assocChoices}
                    setChoicesViewKey={typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR ? onSetChoicesAssocViewKey
                      : onSetChoicesViewKey}
                    formName={[groupKey, MEASUREMENT_KEYS.LINEAR]}
                    formProps={formProps}
                    isManualMeasurement={isManualMeasurement}
                    isPlanarLinear={typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR}
                  />
                </>
              )}
          </>
        )}
      </>
    );
  };

  const renderMeasurementModalContent = () => {
    const typeObj = MEASUREMENT_TYPES.find(t => equalsIgnoreOrder(t.compass_toggles, compassMeasurementTypes));
    const formName = [groupKey, measurementTypeForForm];
    const saveTitle = 'Save ' + typeObj.save_title + (relevantTemplates.length > 1 ? 's' : '');
    return (
      <OverlayWrapper
        closeModal={onCloseButton}
        buttonTitleRight={(choicesViewKey || assocChoicesViewKey) ? 'Done' : isShowTemplates ? '' : null}
        onPress={onPress}
      >
        <>
          {measurementTypeForForm && (
            <FlatList
              bounces={false}
              listKey={'form'}
              ListHeaderComponent={
                <Formik
                  innerRef={formRef}
                  initialValues={initialValues}
                  initialStatus={{formName: formName}}
                  onSubmit={values => console.log('Submitting form...', values)}
                  validate={values => validateForm({formName: formName, values: values})}
                  validateOnChange={false}
                  enableReinitialize={true}
                >
                  {formProps => choicesViewKey ? renderSubform(formProps)
                    : assocChoicesViewKey ? renderSubformAssoc(formProps) : renderForm(formProps)}
                </Formik>
              }
            />
          )}
          {!choicesViewKey && !assocChoicesViewKey && !isShowTemplates && isManualMeasurement && (
            <SaveButton title={saveTitle} onPress={saveMeasurement}/>
          )}
        </>
      </OverlayWrapper>
    );
  };

  const renderSubform = (formProps) => {
    let relevantFields = getRelevantFields(survey, choicesViewKey);
    if (choicesViewKey === 'feature_type') {
      relevantFields = survey.filter(f => f.name === choicesViewKey || f.name === 'other_feature');
    }
    return <Form {...{formName: formProps.status.formName, surveyFragment: relevantFields, ...formProps}}/>;
  };

  const renderSubformAssoc = (formProps) => {
    let assocFormProps = JSON.parse(JSON.stringify(formProps));
    assocFormProps.values = {};
    const assocFormName = [groupKey, 'linear_orientation'];
    assocFormProps.status = {formName: assocFormName};
    const assocSurvey = getSurvey(assocFormName);
    let relevantFields = getRelevantFields(assocSurvey, assocChoicesViewKey);
    if (assocChoicesViewKey === 'feature_type') {
      relevantFields = assocSurvey.filter(f => f.name === assocChoicesViewKey || f.name === 'other_feature');
    }
    return (
      <Form {...{
        ...formProps,
        formName: assocFormProps.status.formName,
        surveyFragment: relevantFields,
        subkey: 'associated_orientation',
      }}
      />
    );
  };

  const saveMeasurement = async () => {
    const typeKey = MEASUREMENT_TYPES[selectedTypeIndex]
    && MEASUREMENT_TYPES[selectedTypeIndex].key === MEASUREMENT_KEYS.PLANAR_LINEAR ? MEASUREMENT_KEYS.PLANAR_LINEAR
      : measurementTypeForForm;
    // If plane with associated line copy label from plane data to line data
    if (typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR) {
      if (formRef.current?.values?.label) {
        formRef.current.setFieldValue('associated_orientation[0].label', formRef.current.values.label);
      }
    }
    try {
      await formRef.current.submitForm();
      let editedMeasurementData = showErrors(formRef.current);
      // If plane with associated line validate associated line data
      if (typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR && editedMeasurementData.associated_orientation) {
        validateForm({
          formName: [groupKey, MEASUREMENT_KEYS.LINEAR],
          values: editedMeasurementData.associated_orientation[0],
        });
      }
      const spotToUpdate = modalVisible === MODAL_KEYS.SHORTCUTS.MEASUREMENT ? await setPointAtCurrentLocation()
        : spot;
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
            if (planarTabularTemplates.length === 0) planarTabularTemplates = [editedMeasurementData];
            if (linearTemplates.length === 0) linearTemplates = editedMeasurementData.associated_orientation;
            planarTabularTemplates.forEach((t) => {
              const associatedMeasurements = linearTemplates.map(
                lT => ({...lT.values, ...editedMeasurementData.associated_orientation[0], id: getNewUUID()}));
              editedMeasurementsData.push(
                {
                  ...t.values,
                  ...editedMeasurementData,
                  id: getNewUUID(),
                  associated_orientation: associatedMeasurements,
                });
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
      console.log('Error submitting form', err);
    }
  };

  const setMeasurements = (data) => {
    const typeKey = MEASUREMENT_TYPES[selectedTypeIndex]
    && MEASUREMENT_TYPES[selectedTypeIndex].key === MEASUREMENT_KEYS.PLANAR_LINEAR ? MEASUREMENT_KEYS.PLANAR_LINEAR
      : measurementTypeForForm;
    const planarCompassFields = ['strike', 'dip_direction', 'dip', 'quality', 'unix_timestamp'];
    const linearCompassFields = ['trend', 'plunge', 'rake', 'quality', 'unix_timestamp'];
    const compassFields = measurementTypeForForm === MEASUREMENT_KEYS.PLANAR ? planarCompassFields
      : linearCompassFields;
    compassFields.forEach((compassFieldKey) => {
      formRef.current.setFieldValue(compassFieldKey,
        isEmpty(data?.[compassFieldKey]) ? undefined : data?.[compassFieldKey]);
    });
    if (typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR) {
      linearCompassFields.forEach((compassFieldKey) => {
        formRef.current.setFieldValue('associated_orientation[0]' + [compassFieldKey],
          isEmpty(data?.[compassFieldKey]) ? undefined : data?.[compassFieldKey]);
      });
    }
    saveMeasurement().catch(console.error);
  };

  return renderMeasurementModalContent();
};

export default AddMeasurementModal;
