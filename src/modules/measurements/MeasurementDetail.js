import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {ButtonGroup, ListItem} from '@rn-vui/base';
import {Formik} from 'formik';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import MeasurementItem from './MeasurementItem';
import {isEmptyMeasurement} from './measurements.helpers';
import styles from './measurements.styles';
import useMeasurements from './useMeasurements';
import commonStyles from '../../shared/common.styles';
import {isEmpty, toTitleCase} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import {FormFlatList} from '../../shared/ui';
import alert from '../../shared/ui/alert';
import AddButton from '../../shared/ui/buttons/AddButton';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import {COMPASS_TOGGLE_BUTTONS} from '../compass/compass.constants';
import {setCompassMeasurements, setCompassMeasurementTypes} from '../compass/compass.slice';
import useCompassCalculations from '../compass/useCompassCalculations';
import {Form, useForm} from '../form';
import {setModalVisible} from '../home/home.slice';
import PageHeader from '../page/PageHeader';
import {MODAL_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties, setSelectedAttributes} from '../spots/spots.slice';

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

  const {doMeasurementCalculations} = useCompassCalculations();
  const {showErrors, validateForm} = useForm();
  const {deleteMeasurements} = useMeasurements();
  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);

  const [formName, setFormName] = useState([]);
  const [isAddingAssociatedMeasurementAfterSave, setIsAddingAssociatedMeasurementAfterSave] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);

  /* Derived Variables */

  const isTemplate = saveTemplate;
  const selectedAttitude = selectedAttributes?.length > 0 ? JSON.parse(JSON.stringify(selectedAttributes[0]))
    : isTemplate ? selectedAttitudes[0]
      : {};

  /* Side Effects */

  useLayoutEffect(() => {
    console.log('ULE MeasurementDetail []');
    return () => confirmLeavePage();
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
        const fieldsToUpdate = selectedMeasurement.type === 'linear_orientation'
          ? ['trend', 'plunge', 'rake', 'rake_calculated', 'quality']
          : selectedMeasurement.type === 'planar_orientation' || selectedMeasurement.type === 'tabular_orientation'
            ? ['strike', 'dip', 'dip_direction', 'quality']
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
      if (selectedMeasurement.type === 'planar_orientation' || selectedMeasurement.type === 'tabular_orientation') {
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

  const onMyChange = (name, value) => {
    if (name === 'rake' || name === 'strike' || name === 'dip_direction') {
      const valueAsFloat = parseFloat(value, 10);
      if (!isNaN(valueAsFloat) && typeof valueAsFloat === 'number') {
        doMeasurementCalculations(name, valueAsFloat, formRef.current, selectedAttitude, selectedMeasurement);
      }
      else formRef.current.setFieldValue(name, undefined);
    }
    else formRef.current.setFieldValue(name, value);
  };

  // Confirm switch between Planar and Tabular Zone
  const onSwitchPlanarTabular = (i) => {
    const currentType = formRef.current.values.type;
    if ((i === 0 && currentType === 'tabular_orientation') || (i === 1 && currentType === 'planar_orientation')) {
      const newType = currentType === 'tabular_orientation' ? 'planar_orientation' : 'tabular_orientation';
      const typeText = newType === 'tabular_orientation' ? 'Tabular Zone' : 'Planar Orientation';
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
    const types = selectedAttitude.type === 'linear_orientation' ? [COMPASS_TOGGLE_BUTTONS.PLANAR]
      : [COMPASS_TOGGLE_BUTTONS.LINEAR];
    dispatch(setCompassMeasurementTypes(types));
    dispatch(setModalVisible({modal: MODAL_KEYS.NOTEBOOK.MEASUREMENTS}));
  };

  const cancelFormAndGo = () => {
    setSelectedMeasurement({});
    formRef.current?.resetForm();
    if (isEmptyMeasurement(selectedAttitude)) {
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

  const confirmLeavePage = () => {
    if (!isTemplate && formRef.current && formRef.current.dirty) {
      const formCurrent = formRef.current;
      alert('Unsaved Changes',
        'Would you like to save your data before continuing?',
        [{
          text: 'No',
          style: 'cancel',
          onPress: () => {
            dispatch(setSelectedAttributes([]));
            console.log('Cancel Pressed', selectedAttributes);
          },
        }, {
          text: 'Yes',
          onPress: async () => {
            await saveForm(formCurrent);
            dispatch(setSelectedAttributes([]));
          },
        }],
        {cancelable: false},
      );
    }
    else dispatch(setSelectedAttributes([]));
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
      if (selectedMeasurement.type === 'tabular_orientation') return 'Tabular Zone Detail';
      else return toTitleCase(selectedMeasurement.type.replace('_', ' ').replace('orientation', 'feature')) + ' Detail';
    }
    else return 'Measurement Detail';
  };

  const saveForm = async (formCurrent) => {
    try {
      await formCurrent.submitForm();
      let formValues = showErrors(formRef.current || formCurrent, isEmpty(formRef.current));
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
          orientationDataCopy[i] = selectedAttributes.length === 1
            ? {...formValues, modified_timestamp: Date.now()}
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
      await formCurrent.resetForm();
      if (Platform.OS !== 'web') toast.show('Measurement Saved', {type: 'success'});
      console.log('Finished saving form data to Spot');
    }
    catch (err) {
      console.error('Error submitting form.', err);
      return Promise.reject();
    }
  };

  const saveFormAndAddAssociatedMeasurement = async () => {
    try {
      setIsAddingAssociatedMeasurementAfterSave(true);
      await saveForm(formRef.current);
    }
    catch (err) {
      console.error('Error saving form data to Spot');
    }
  };

  const saveFormAndGo = async () => {
    try {
      await saveForm(formRef.current);
      closeDetailView();
    }
    catch (err) {
      console.error('Error saving form data to Spot');
    }
  };

  const saveFormAndSwitchSelectedMeasurement = async (measurement) => {
    try {
      await saveForm(formRef.current);
      switchSelectedMeasurement(measurement);
    }
    catch (err) {
      console.error('Error saving form data to Spot');
    }
  };

  const saveTemplateForm = async (formCurrent) => {
    await formCurrent.submitForm();
    const formValues = showErrors(formRef.current || formCurrent, isEmpty(formRef.current));
    await saveTemplate(formValues);
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

  /* Render Functions */

  const renderAssociatedMeasurements = () => {
    const addButtonText = selectedAttitude && selectedAttitude.type === 'linear_orientation'
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
          <Formik
            enableReinitialize={true}
            initialStatus={{formName: formName}}
            initialValues={selectedMeasurement}
            innerRef={formRef}
            onReset={() => console.log('Resetting form...')}
            onSubmit={values => console.log('Submitting form...', values)}
            validate={values => validateForm({formName: formName, values: values})}
          >
            {formProps => (
              <Form {...{
                ...formProps,
                formName: formName,
                isReadOnly: isReadOnly,
                onMyChange: onMyChange,
              }}/>
            )}
          </Formik>
        </View>
      </View>
    );
  };

  const renderMultiMeasurementsBar = () => {
    const mainText = selectedAttitude.type === 'linear_orientation' ? 'Multiple Lines' : 'Multiple Planes';
    const propertyText = selectedAttitude.type === 'linear_orientation' ? 'Plunge -> Trend' : 'Strike/Dip';
    const hasAssociated = selectedAttitude.associated_orientation && selectedAttitude.associated_orientation.length > 0;
    const mainText2 = hasAssociated && selectedAttitude.associated_orientation[0].type === 'linear_orientation'
      ? 'Multiple Lines' : 'Multiple Planes';
    const propertyText2 = hasAssociated && selectedAttitude.associated_orientation[0].type === 'linear_orientation'
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
        buttons={['Planar Feature', 'Tabular Zone']}
        containerStyle={styles.measurementDetailSwitches}
        onPress={i => onSwitchPlanarTabular(i)}
        selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
        selectedIndex={selectedMeasurement.type === 'planar_orientation' ? 0 : 1}
        textStyle={{color: PRIMARY_ACCENT_COLOR}}
      />
    );
  };

  /* View */

  return (
    <>
      <View style={{flex: 1}}>
        {selectedMeasurement && (
          <View style={styles.measurementsContentContainer}>
            <PageHeader hideBackButton={!isReadOnly} onPressBack={cancelFormAndGo} pageTitle={getPageTitle()}/>
            {!isReadOnly && renderCancelSaveButtons()}
            <FormFlatList>
              <View>
                {!isTemplate && selectedMeasurement && selectedAttributes.length === 1 && renderAssociatedMeasurements()}
                {!isTemplate && selectedMeasurement && selectedAttributes.length > 1 && renderMultiMeasurementsBar()}
                {!isReadOnly && selectedMeasurement && selectedMeasurement.type
                  && (selectedMeasurement.type === 'planar_orientation'
                    || selectedMeasurement.type === 'tabular_orientation') && renderPlanarTabularSwitches()}
                <View>
                  {!isEmpty(formName) && renderFormFields()}
                </View>
                {selectedAttributes.length === 1 && !isReadOnly && (
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
