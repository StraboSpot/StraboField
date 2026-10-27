import React, {useContext, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {ButtonGroup, ListItem} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import MeasurementItem from './MeasurementItem';
import {MEASUREMENT_KEYS, MEASUREMENT_TYPE_LABELS} from './measurements.constants';
import {isEmptyMeasurement, isPlanarType} from './measurements.helpers';
import styles from './measurements.styles';
import useMeasurements from './useMeasurements';
import commonStyles from '../../shared/common.styles';
import {isEmpty, toTitleCase} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR, SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import AddButton from '../../shared/ui/buttons/AddButton';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import {COMPASS_TOGGLE_BUTTONS} from '../compass/compass.constants';
import {setOrientationFieldValue} from '../compass/compass.helpers';
import {setCompassMeasurements, setCompassMeasurementTypes} from '../compass/compass.slice';
import Form from '../form/Form';
import FormFlatList from '../form/FormFlatList';
import FormikWrapper from '../form/FormikWrapper';
import useForm from '../form/useForm';
import {setActiveModal} from '../home/home.slice';
import {LeavePageContext, useUnsavedFormChanges} from '../notebook-panel/LeavePageContext';
import {resolveLabelOnSave} from '../page/featureLabels.helpers';
import PageHeader from '../page/PageHeader';
import {MODAL_KEYS, PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {deselectedAttributes, editedSpotProperties, setSelectedAttributes} from '../spots/spots.slice';
import TemplateNameField from '../templates/TemplateNameField';
import {TEMPLATE_FIELD_LABELS} from '../templates/templates.constants';
import {validateTemplateName} from '../templates/templates.helpers';

const MeasurementDetail = ({
                             closeDetailView,
                             deleteTemplate,
                             isReadOnly,
                             selectedAttitudes,
                             saveTemplate,
                           }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const compassMeasurements = useSelector(state => state.compass.measurements);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);
  const {confirmLeavePage, hasUnsavedPageChanges} = useContext(LeavePageContext);

  const {getLabel, getLabels, submitAndShowErrors, validateForm} = useForm();
  const {deleteMeasurements} = useMeasurements();
  const toast = useToast();

  // A template (saveTemplate given) registers with TemplatesPicker's gate instead
  const formRef = useRef(null);
  const {isFormDirty, isFormInvalid, markSaved, setIsFormDirty, setIsFormInvalid} = useUnsavedFormChanges({
    formRef: formRef,
    getMessage: () => (saveTemplate ? 'Your changes to this measurement template haven\'t been saved.'
      : selectedAttributes.length > 1 ? 'Your changes to these measurements haven\'t been saved.'
        : 'Your changes to this measurement haven\'t been saved.'),
    save: () => (saveTemplate ? saveTemplateForm(formRef.current) : saveForm(formRef.current)),
  });

  /* Local State */

  // The selection as this view last showed it, which is all it may drop as it closes
  const selectedAttributesRef = useRef(selectedAttributes);
  selectedAttributesRef.current = selectedAttributes;

  const [formName, setFormName] = useState([]);
  const [isAddingAssociatedMeasurementAfterSave, setIsAddingAssociatedMeasurementAfterSave] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);

  /* Derived Variables */

  const isTemplate = saveTemplate;
  const selectedAttitude = selectedAttributes?.length > 0 ? JSON.parse(JSON.stringify(selectedAttributes[0]))
    : isTemplate ? selectedAttitudes[0]
      : {};

  /* Side Effects */

  // The measurements stay selected only while their detail is open
  useLayoutEffect(() => {
    console.log('ULE MeasurementDetail []');
    return () => dispatch(deselectedAttributes(selectedAttributesRef.current));
  }, []);

  // Update selected Measurement on selected Attitudes changed or return to Measurements page if no selected Attitude
  useEffect(() => {
    console.log('UE MeasurementDetail [selectedAttributes]', selectedAttributes);
    if (isAddingAssociatedMeasurementAfterSave) {
      setIsAddingAssociatedMeasurementAfterSave(false);
      addAssociatedMeasurement();
    }
    else if (!isEmpty(selectedAttitude)) switchSelectedMeasurement(selectedAttitude);
    else closeDetailView();
  }, [selectedAttributes]);

  // Update field values for measurements on grabbing new compass measurements
  useEffect(() => {
    console.log('UE MeasurementDetail [compassMeasurements]', compassMeasurements);
    if (!isEmpty(compassMeasurements)) {
      console.log('New compass measurement recorded AND DETAIL OPEN.', compassMeasurements);
      if (!isEmpty(selectedMeasurement) && selectedMeasurement.type) {
        const fieldsToUpdate = selectedMeasurement.type === MEASUREMENT_KEYS.LINEAR
          ? ['trend', 'plunge', 'rake', 'rake_calculated', 'quality']
          : isPlanarType(selectedMeasurement.type) ? ['strike', 'dip', 'dip_direction', 'quality']
            : [];
        fieldsToUpdate.forEach(field => formRef.current.setFieldValue(field, compassMeasurements[field]));
      }
      dispatch(setCompassMeasurements({}));
    }
  }, [compassMeasurements]);

  // Set compass measurement type on changing the selected measurement type
  useEffect(() => {
    console.log('UE MeasurementDetail [selectedMeasurement]', selectedMeasurement);
    if (!isTemplate && !isEmpty(selectedMeasurement) && selectedMeasurement.type) {
      if (isPlanarType(selectedMeasurement.type)) {
        dispatch(setCompassMeasurementTypes([COMPASS_TOGGLE_BUTTONS.PLANAR]));
      }
      else dispatch(setCompassMeasurementTypes([COMPASS_TOGGLE_BUTTONS.LINEAR]));
    }
  }, [selectedMeasurement]);

  /* Event Handlers */

  // Confirm switching the selected measurement
  const onAddAssociatedMeasurement = () => {
    if (formRef.current.dirty) {
      alert('Unsaved Changes',
        'Would you like to save your data before continuing?',
        [{
          text: 'No',
          onPress: () => {
            formRef.current.resetForm();
            addAssociatedMeasurement();
          },
          style: 'cancel',
        }, {
          text: 'Yes',
          onPress: () => saveFormAndAddAssociatedMeasurement(),
        }],
        {cancelable: false},
      );
    }
    else addAssociatedMeasurement();
  };

  // Entering a strike fills in the dip direction and the reverse, and a rake the trend and plunge
  const setFieldValueAndPairedOrientation = (name, value) => setOrientationFieldValue(formRef.current, name, value,
    {selectedAttitude: selectedAttitude, selectedMeasurement: selectedMeasurement});

  // Confirm switch between Planar and Tabular Zone
  const onSwitchPlanarTabular = (i) => {
    const currentType = formRef.current.values.type;
    if ((i === 0 && currentType === MEASUREMENT_KEYS.TABULAR) || (i === 1 && currentType === MEASUREMENT_KEYS.PLANAR)) {
      const newType = currentType === MEASUREMENT_KEYS.TABULAR ? MEASUREMENT_KEYS.PLANAR : MEASUREMENT_KEYS.TABULAR;
      const typeText = newType === MEASUREMENT_KEYS.TABULAR ? MEASUREMENT_TYPE_LABELS[newType] : 'Planar Orientation';
      const alertTextEnd = selectedAttributes.length === 1 ? 'this measurement to a ' + typeText + '? You will '
        + 'lose all data for this measurement not relevant to ' + typeText + '.'
        : 'these measurements to ' + typeText + '? You will lose all data for these measurements not relevant to '
        + typeText + '.';
      alert('Switch to ' + typeText, 'Are you sure you want to switch ' + alertTextEnd,
        [{
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        }, {
          text: 'OK', onPress: () => switchPlanarTabular(newType),
        }],
        {cancelable: false},
      );
    }
  };

  // Confirm switching the selected measurement
  const onSwitchSelectedMeasurement = (measurement) => {
    if (measurement.id !== selectedMeasurement.id) {
      if (formRef.current.dirty) {
        alert('Unsaved Changes',
          'Would you like to save your data before continuing?',
          [{
            text: 'No',
            onPress: () => switchSelectedMeasurement(measurement),
            style: 'cancel',
          }, {
            text: 'Yes',
            onPress: () => saveFormAndSwitchSelectedMeasurement(measurement),
          }],
          {cancelable: false},
        );
      }
      else switchSelectedMeasurement(measurement);
    }
  };

  /* Logic Helpers */

  const addAssociatedMeasurement = () => {
    const types = selectedAttitude.type === MEASUREMENT_KEYS.LINEAR ? [COMPASS_TOGGLE_BUTTONS.PLANAR]
      : [COMPASS_TOGGLE_BUTTONS.LINEAR];
    dispatch(setCompassMeasurementTypes(types));
    dispatch(setActiveModal({modal: MODAL_KEYS.NOTEBOOK.MEASUREMENTS}));
  };

  const cancelFormAndGo = async () => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
    setSelectedMeasurement({});
    formRef.current?.resetForm();
    // A measurement left empty is removed from the Spot; a template is not on one
    if (!isTemplate && isEmptyMeasurement(selectedAttitude)) {
      const aOs = selectedAttitude.associated_orientation || [];
      deleteMeasurements([...aOs, selectedAttitude]);
    }
    closeDetailView();
  };

  const confirmDeleteMeasurement = () => {
    alert(
      'Delete Measurement',
      'Are you sure you want to delete this measurement?',
      [{
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      }, {
        text: 'OK',
        onPress: () => deleteMeasurement(),
      }],
      {cancelable: false},
    );
  };

  // Delete a single measurement
  const deleteMeasurement = () => {
    try {
      deleteMeasurements([selectedMeasurement]);
      closeDetailView();
    }
    catch (err) {
      console.error('Unable to delete measurement.');
    }
  };

  const getPageTitle = () => {
    if (selectedMeasurement?.type) {
      const {type} = selectedMeasurement;
      if (type === MEASUREMENT_KEYS.TABULAR) return MEASUREMENT_TYPE_LABELS[type] + ' Detail';
      else return toTitleCase(type.replace('_', ' ').replace('orientation', 'feature')) + ' Detail';
    }
    else return 'Measurement Detail';
  };

  // What comes back says whether the save happened: a refusal has already alerted about the field it stopped on,
  // so the caller stays where it is for that to be fixed rather than carrying on.
  const saveForm = async (formCurrent) => {
    try {
      let {errors, values: formValues} = await submitAndShowErrors(formRef.current || formCurrent);
      // A bulk edit leaves the label out below, along with everything else that names one measurement rather
      // than the group, so only a single measurement is labeled here
      if (selectedAttributes.length === 1) {
        formValues = resolveLabelOnSave({pageKey: PAGE_KEYS.MEASUREMENTS,
          previousFeature: selectedMeasurement, values: formValues, getLabel: getLabel, getLabels: getLabels});
      }
      console.log('Saving form data to Spot ...');
      let orientationDataCopy = JSON.parse(JSON.stringify(spot.properties.orientation_data));
      let editedSelectedMeasurements = [];
      let idsOfMeasurementsToEdit = [formValues.id];
      if (selectedAttributes.length > 1) {
        const fieldsToExclude = ['id', 'associated_orientation', 'label', 'strike', 'dip_direction', 'dip',
          'trend', 'plunge', 'rake', 'rake_calculated'];
        fieldsToExclude.forEach(key => delete formValues[key]);
        if (formCurrent.values.id === selectedAttitude.id) {
          idsOfMeasurementsToEdit = selectedAttributes.map(measurement => measurement.id);
        }
        else {
          idsOfMeasurementsToEdit = selectedAttributes.reduce(
            (acc, measurement) => [...acc, ...measurement.associated_orientation.map(
              associatedOrientation => associatedOrientation.id)], []);
        }
      }

      orientationDataCopy.forEach((measurement, i) => {
        if (idsOfMeasurementsToEdit.includes(measurement.id)) {
          orientationDataCopy[i] = selectedAttributes.length === 1 ? {...formValues, modified_timestamp: Date.now()}
            : {...measurement, ...formValues};
          editedSelectedMeasurements.push(orientationDataCopy[i]);
        }
        else if (measurement.associated_orientation) {
          measurement.associated_orientation.forEach((associatedMeasurement, j) => {
            if (idsOfMeasurementsToEdit.includes(associatedMeasurement.id)) {
              orientationDataCopy[i].associated_orientation[j] = selectedAttributes.length === 1 ? formValues
                : {...associatedMeasurement, ...formValues};
              editedSelectedMeasurements.push(orientationDataCopy[i]);
            }
          });
        }
      });
      dispatch(setSelectedAttributes(editedSelectedMeasurements));
      const spotId = spot.properties.id;
      dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
      dispatch(editedSpotProperties({field: 'orientation_data', value: orientationDataCopy, spotId: spotId}));
      markSaved();
      await formCurrent.resetForm();
      // A value already invalid when the form opened is rolled back and the rest saved, so don't claim a full save
      if (Platform.OS !== 'web' && isEmpty(errors)) toast.show('Measurement Saved', {type: 'success'});
      console.log('Finished saving form data to Spot');
      return true;
    }
    catch (err) {
      console.error('Error submitting form.', err);
      return false;
    }
  };

  // The effect on the selected attributes is what adds the measurement, and a save is what changes them, so the
  // flag has to be set before saving rather than after. A refused save never reaches that dispatch, so clear the
  // flag rather than leaving it to fire on whatever changes the selected attributes next.
  const saveFormAndAddAssociatedMeasurement = async () => {
    setIsAddingAssociatedMeasurementAfterSave(true);
    const isSaved = await saveForm(formRef.current);
    if (!isSaved) setIsAddingAssociatedMeasurementAfterSave(false);
  };

  const saveFormAndGo = async () => {
    if (await saveForm(formRef.current)) closeDetailView();
  };

  const saveFormAndSwitchSelectedMeasurement = async (measurement) => {
    if (await saveForm(formRef.current)) switchSelectedMeasurement(measurement);
  };

  // Always resolves true for the gate, which already holds Save while the form has errors
  const saveTemplateForm = async (formCurrent) => {
    const {values: formValues} = await submitAndShowErrors(formRef.current || formCurrent);
    markSaved();
    await saveTemplate(formValues);
    return true;
  };

  // Switch between Planar and Tabular Zone
  const switchPlanarTabular = (type) => {
    const modifiedMeasurement = {...formRef.current.values, type: type};
    switchSelectedMeasurement(modifiedMeasurement);
  };

  // Switch the selected measurement
  const switchSelectedMeasurement = (measurement) => {
    setSelectedMeasurement(measurement);
    let formCategory = selectedAttributes.length === 1 && !isTemplate ? 'measurement' : 'measurement_bulk';
    setFormName([formCategory, measurement.type]);
  };

  const validateTemplate = values => ({...validateForm({formName: formName, values: values}).errors,
    ...validateTemplateName(values)});

  /* Render Functions */

  const renderAssociatedMeasurements = () => {
    const addButtonText = selectedAttitude && selectedAttitude.type === MEASUREMENT_KEYS.LINEAR
      ? 'Add Associated Plane' : 'Add Associated Line';
    console.log('selected id', selectedMeasurement.id);
    return (
      <View>
        {/* Primary measurement */}
        {selectedMeasurement && selectedAttitude && selectedAttitude.associated_orientation && (
          <>
            <MeasurementItem
              isDetail={true}
              item={selectedAttitude}
              onPress={() => onSwitchSelectedMeasurement(selectedAttitude)}
              selectedIds={[selectedMeasurement.id]}
            />
            <FlatListItemSeparator/>
          </>
        )}

        {/* Associated measurements */}
        {selectedMeasurement && selectedAttitude && selectedAttitude.associated_orientation
          && (selectedAttitude.associated_orientation.map(item =>
              <React.Fragment key={item.id + 'Outer'}>
                <MeasurementItem
                  item={item}
                  key={item.id}
                  onPress={() => onSwitchSelectedMeasurement(item)}
                  selectedIds={[selectedMeasurement.id]}
                />
                <FlatListItemSeparator/>
              </React.Fragment>,
            )
          )}

        {/* Button to add an associated measurement */}
        {!isReadOnly && <AddButton onPress={onAddAssociatedMeasurement} title={addButtonText}/>}
      </View>
    );
  };

  const renderCancelSaveButtons = () => {
    return (
      <SaveAndCancelButtons
        cancel={cancelFormAndGo}
        // Nothing changed means nothing to save
        getIsDisabled={isFormInvalid || !isFormDirty}
        save={() => isTemplate ? saveTemplateForm(formRef.current) : saveFormAndGo()}
      />
    );
  };

  const renderFormFields = () => {
    console.log('Rendering Form:', formName[0] + '.' + formName[1], '\nSelected Measurements:',
      selectedAttributes, '\nSelected Individual Measurement:', selectedMeasurement);
    return (
      <View>
        <View style={{flex: 1}}>
          <FormikWrapper
            enableReinitialize={true}
            fieldLabels={isTemplate ? TEMPLATE_FIELD_LABELS : undefined}
            formName={formName}
            initialValues={selectedMeasurement}
            innerRef={formRef}
            onReset={() => console.log('Resetting form...')}
            setIsFormDirty={setIsFormDirty}
            setIsFormInvalid={setIsFormInvalid}
            validate={isTemplate ? validateTemplate : undefined}
          >
            {formProps => (
              <>
                {isTemplate && <TemplateNameField/>}
                <Form
                  {...formProps}
                  formName={formName}
                  isReadOnly={isReadOnly}
                  setNumberFieldValueOverride={setFieldValueAndPairedOrientation}
                />
              </>
            )}
          </FormikWrapper>
        </View>
      </View>
    );
  };

  const renderMultiMeasurementsBar = () => {
    const mainText = selectedAttitude.type === MEASUREMENT_KEYS.LINEAR ? 'Multiple Lines' : 'Multiple Planes';
    const propertyText = selectedAttitude.type === MEASUREMENT_KEYS.LINEAR ? 'Plunge -> Trend' : 'Strike/Dip';
    const hasAssociated = selectedAttitude.associated_orientation && selectedAttitude.associated_orientation.length > 0;
    const mainText2 = hasAssociated && selectedAttitude.associated_orientation[0].type === MEASUREMENT_KEYS.LINEAR
      ? 'Multiple Lines' : 'Multiple Planes';
    const propertyText2 = hasAssociated && selectedAttitude.associated_orientation[0].type === MEASUREMENT_KEYS.LINEAR
      ? 'Plunge -> Trend' : 'Strike/Dip';

    return (
      <View>
        <ListItem
          containerStyle={selectedMeasurement.id === selectedAttitude.id && commonStyles.listItemInverse}
          onPress={() => onSwitchSelectedMeasurement(selectedAttitude)}
          pad={5}
        >
          <ListItem.Content>
            <ListItem.Title
              style={selectedMeasurement.id === selectedAttitude.id ? commonStyles.listItemTitleInverse
                : commonStyles.listItemTitle}>{mainText}
            </ListItem.Title>
          </ListItem.Content>
          <ListItem.Content>
            <ListItem.Title
              style={selectedMeasurement.id === selectedAttitude.id ? commonStyles.listItemTitleInverse
                : commonStyles.listItemTitle}
            >
              {propertyText}
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
        {hasAssociated && (
          <ListItem
            containerStyle={selectedMeasurement.id === selectedAttitude.associated_orientation[0].id && commonStyles.listItemInverse}
            onPress={() => onSwitchSelectedMeasurement(selectedAttitude.associated_orientation[0])}
            pad={5}
          >
            <ListItem.Content>
              <ListItem.Title
                style={selectedMeasurement.id === selectedAttitude.associated_orientation[0].id
                  ? commonStyles.listItemTitleInverse : commonStyles.listItemTitle}
              >
                {mainText2}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Content>
              <ListItem.Title
                style={selectedMeasurement.id === selectedAttitude.associated_orientation[0].id
                  ? commonStyles.listItemTitleInverse : commonStyles.listItemTitle}
              >
                {propertyText2}
              </ListItem.Title>
            </ListItem.Content>
          </ListItem>
        )}
        {hasAssociated && (
          <Text style={styles.basicText}>Only one associated line or plane can be classified in bulk</Text>
        )}
        <View style={{paddingBottom: 15}}/>
      </View>
    );
  };

  // Render the buttons to switch between planar and tabular zone orientations
  const renderPlanarTabularSwitches = () => {
    return (
      <ButtonGroup
        buttons={['Planar Feature', MEASUREMENT_TYPE_LABELS[MEASUREMENT_KEYS.TABULAR]]}
        containerStyle={styles.measurementDetailSwitches}
        onPress={i => onSwitchPlanarTabular(i)}
        selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
        selectedIndex={selectedMeasurement.type === MEASUREMENT_KEYS.PLANAR ? 0 : 1}
        textStyle={{color: PRIMARY_ACCENT_COLOR, fontSize: SMALL_TEXT_SIZE}}
      />
    );
  };

  /* View */

  return (
    <>
      <View style={{flex: 1}}>
        {selectedMeasurement && (
          <View style={styles.measurementsContentContainer}>
            {/* A template is edited in a modal whose header already names it */}
            {!isTemplate && (
              <PageHeader hideBackButton={!isReadOnly} onPressBack={cancelFormAndGo} pageTitle={getPageTitle()}/>
            )}
            {!isReadOnly && renderCancelSaveButtons()}
            <FormFlatList>
              <View>
                {!isTemplate && selectedMeasurement && selectedAttributes.length === 1 && renderAssociatedMeasurements()}
                {!isTemplate && selectedMeasurement && selectedAttributes.length > 1 && renderMultiMeasurementsBar()}
                {!isReadOnly && selectedMeasurement && isPlanarType(selectedMeasurement.type)
                  && renderPlanarTabularSwitches()}
                <View>
                  {!isEmpty(formName) && renderFormFields()}
                </View>
                {/* A template can be deleted once saved, when TemplatesPicker hands over deleteTemplate */}
                {(isTemplate ? !!deleteTemplate : selectedAttributes.length === 1) && !isReadOnly && (
                  <DeleteButton
                    onPress={() => isTemplate ? deleteTemplate() : confirmDeleteMeasurement()}
                    title={isTemplate ? 'Delete Measurement Template' : 'Delete Measurement'}
                  />
                )}
              </View>
            </FormFlatList>
          </View>
        )}
      </View>
    </>
  );
};

export default MeasurementDetail;
