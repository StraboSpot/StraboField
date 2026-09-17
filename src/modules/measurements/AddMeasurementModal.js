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
} from './measurements.constants';
import {equalsIgnoreOrder, getMeasurementTypeText} from './measurements.helpers';
import commonStyles from '../../shared/common.styles';
import {getNewUUID, isEmpty} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR, SMALL_SCREEN} from '../../shared/styles.constants';
import Loading from '../../shared/ui/Loading';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SliderBar from '../../shared/ui/SliderBar';
import SwitchWrapper from '../../shared/ui/SwitchWrapper';
import Compass from '../compass/Compass';
import {setCompassMeasurementTypes} from '../compass/compass.slice';
import compassStyles from '../compass/compass.styles';
import Form from '../form/Form';
import FormikWrapper from '../form/FormikWrapper';
import useForm from '../form/useForm';
import {setModalValues, setModalVisible} from '../home/home.slice';
import useDeviceOrientation from '../home/useDeviceOrientation';
import useMapLocation from '../maps/view/useMapLocation';
import {MODAL_KEYS, PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties, setSelectedAttributes} from '../spots/spots.slice';
import {MEASUREMENT_TEMPLATE_KEY} from '../templates/templates.constants';
import {
  getActiveTemplateList,
  getIsTemplateInUse,
  getLinearTemplates,
  getPlanarTemplates,
} from '../templates/templates.helpers';
import TemplatesNotebook from '../templates/TemplatesNotebook';
import {setUserData} from '../user/userProfile.slice';

const AddMeasurementModal = ({onPress, openSpotInNotebook, zoomToCurrentLocation}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);
  const defaultManualMeasurement = useSelector(state => state.user.default_manual_measurement);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);
  const templates = useSelector(state => state.project.project?.templates) || {};

  const {lockToCurrentOrientation, unlockOrientation} = useDeviceOrientation();
  const {getChoices, getLabel, getRelevantFields, getSurvey, showErrors, validateForm} = useForm();
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
  const [isSaving, setIsSaving] = useState(false);
  const [isShowTemplates, setIsShowTemplates] = useState(false);
  const [measurementTypeForForm, setMeasurementTypeForForm] = useState(null);
  const [relevantTemplates, setRelevantTemplates] = useState([]);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(6);
  const [survey, setSurvey] = useState({});

  /* Derived Variables */

  // Is an attitude already selected (like when adding an associated measurement to an already existing attitude)
  const isSelectedAttitude = !isEmpty(selectedAttributes) && selectedAttributes?.length > 0;

  // The shortcut makes its own Spot at the current location, where the Notebook is editing the Spot it is open on
  const isShortcutMeasurement = modalVisible === MODAL_KEYS.SHORTCUTS.MEASUREMENT;

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

  // The compass reads correctly in any hold now (trend/plunge follows the edge that's up as held, strike/dip
  // never depended on orientation), so instead of forcing portrait we lock to whatever orientation the user
  // opened it in — the screen then stays put while they move/tilt the tablet to take the reading. Manual
  // entry needs no lock. Phones (SMALL_SCREEN) stay portrait app-wide.
  useEffect(() => {
    if (SMALL_SCREEN || Platform.OS === 'web') return;
    if (isManualMeasurement) unlockOrientation();
    else lockToCurrentOrientation();
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
    // Get the templates for the measurement type. A selected attitude gets none, since it is already there -
    // that is the case of adding an associated measurement to an existing attitude.
    const activeMeasurementTemplates = !isSelectedAttitude && getIsTemplateInUse(templates, MEASUREMENT_TEMPLATE_KEY)
      && getActiveTemplateList(templates, MEASUREMENT_TEMPLATE_KEY) || [];
    const gotRelevantTemplates = activeMeasurementTemplates.filter(
      t => typeObj.form_keys.includes(t.values?.type || t.type));
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

  // A measurement and each orientation associated with it are separate rows, so each is named for itself
  const withDefaultLabel = measurement => ({
    ...measurement,
    label: measurement.label || getMeasurementTypeText(measurement, getLabel),
    ...(measurement.associated_orientation
      && {associated_orientation: measurement.associated_orientation.map(withDefaultLabel)}),
  });

  const saveMeasurement = async () => {
    const typeKey = MEASUREMENT_TYPES[selectedTypeIndex]
    && MEASUREMENT_TYPES[selectedTypeIndex].key === MEASUREMENT_KEYS.PLANAR_LINEAR ? MEASUREMENT_KEYS.PLANAR_LINEAR
      : measurementTypeForForm;
    // If plane with associated line copy label from plane data to line data
    if (typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR) {
      if (formRef.current.values.associated_orientation?.[0]?.label || formRef.current.values.label) {
        formRef.current.setFieldValue('associated_orientation[0].label',
          formRef.current.values.associated_orientation?.[0]?.label);
      }
    }
    // Saving is slow enough to look like nothing happened, so say so on the button. ModalWrapper also shuts its
    // exits while this is set, hence the finally - without it the modal would have no way out.
    setIsSaving(true);
    try {
      await formRef.current.submitForm();
      let editedMeasurementData = showErrors(formRef.current);
      const spotToUpdate = isShortcutMeasurement ? await setPointAtCurrentLocation() : spot;
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
      }
      else {
        if (isSelectedAttitude) {
          editedMeasurementsData = editedMeasurementsData.filter(d => d.id !== editedMeasurementData.id);
          editedMeasurementsData.push(editedMeasurementData);
        }
        else editedMeasurementsData.push({...editedMeasurementData, id: getNewUUID()});
        console.log('editedMeasurementData', editedMeasurementData);
        console.log('Saving Measurement data to Spot ...', editedMeasurementsData);
      }
      // Labeled last, once every branch above has finished building the measurements: a measurement is titled
      // by its feature_type or, failing that, its type, and an associated orientation is only told it is linear
      // part way through. Only an empty label is filled in, so nothing already named is touched.
      editedMeasurementsData = editedMeasurementsData.map(withDefaultLabel);

      // The shortcut's new Spot has to be selected before the write below, so that editedSpotProperties is what
      // leaves it selected: spotToUpdate is the copy taken before the measurement went in, and handing that back
      // afterwards would blank the page being opened.
      if (isShortcutMeasurement) openSpotInNotebook(spotToUpdate, PAGE_KEYS.MEASUREMENTS);

      dispatch(updatedModifiedTimestampsBySpotsIds([spotToUpdate.properties.id]));
      dispatch(editedSpotProperties({field: 'orientation_data', value: editedMeasurementsData}));

      if (isSelectedAttitude) {
        dispatch(setSelectedAttributes([editedMeasurementData]));
        onCloseButton();
      }
      // The shortcut always steps aside; from the Notebook the modal only does so on a small screen, where it
      // covers the page it just saved to. Both before the toast, which a modal on top would paint over.
      if (isShortcutMeasurement || SMALL_SCREEN) dispatch(setModalVisible({modal: null}));
      // After the zoom, which raises a full-screen spinner the toast would otherwise sit behind for most of its
      // life - the reason only shortcut saves looked too fast
      if (isShortcutMeasurement) await zoomToCurrentLocation();
      // Web reports the real outcome itself - 'Saving changes...' then saved or not saved, from the server - so
      // a local 'Saved!' there would be both redundant and, on a failed upload, wrong
      if (Platform.OS !== 'web') toast.show('Measurement Saved!', {type: 'success', duration: 2000});
    }
    catch (err) {
      console.error('Error submitting form', err);
    }
    finally {
      setIsSaving(false);
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

  // Formik validates the survey for the measurement's own type, but a planar+linear measurement carries a linear
  // half under associated_orientation[0], which is a survey of its own and went unchecked - its required fields
  // and the constraints on trend, plunge and rake with it. Formik names those fields by path, so their errors are
  // keyed the same way to reach the field and to be labelled by both halves when they are reported.
  const validateMeasurement = (values) => {
    const {errors} = validateForm({formName: [MEASUREMENT_GROUP_KEY, measurementTypeForForm], values: values});
    if (isEmpty(values.associated_orientation?.[0])) return errors;
    const {errors: associatedErrors} = validateForm({
      formName: [MEASUREMENT_GROUP_KEY, MEASUREMENT_KEYS.LINEAR],
      values: values.associated_orientation[0],
    });
    return Object.entries(associatedErrors).reduce(
      (acc, [name, message]) => ({...acc, ['associated_orientation[0].' + name]: message}), errors);
  };

  /* Render Functions */

  const renderForm = (formProps) => {
    const assocFormName = [MEASUREMENT_GROUP_KEY, 'linear_orientation'];
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
        isLoading={isSaving}
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
                  validate={validateMeasurement}
                >
                  {formProps => choicesViewKey ? renderSubform(formProps)
                    : assocChoicesViewKey ? renderSubformAssoc(formProps) : renderForm(formProps)}
                </FormikWrapper>
              }
              bounces={false}
              listKey={'form'}
            />
          )}
          <Loading isLoading={isSaving}/>
        </>
      </ModalWrapper>
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
    const assocFormName = [MEASUREMENT_GROUP_KEY, 'linear_orientation'];
    assocFormProps.status = {formName: assocFormName};
    const assocSurvey = getSurvey(assocFormName);
    let relevantFields = getRelevantFields(assocSurvey, assocChoicesViewKey);
    if (assocChoicesViewKey === 'feature_type') {
      relevantFields = assocSurvey.filter(f => f.name === assocChoicesViewKey || f.name === 'other_feature');
    }
    return (
      <Form {...{
        formName: assocFormProps.status.formName,
        ...formProps,
        subkey: 'associated_orientation',
        surveyFragment: relevantFields,
      }}
      />
    );
  };

  /* View */

  return renderMeasurementModalContent();
};

export default AddMeasurementModal;
