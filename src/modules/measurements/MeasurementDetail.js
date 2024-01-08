import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Formik} from 'formik';
import {Button, ButtonGroup, ListItem} from 'react-native-elements';
import {useDispatch, useSelector} from 'react-redux';

import MeasurementItem from './MeasurementItem';
import styles from './measurements.styles';
import useMeasurementsHook from './useMeasurements';
import commonStyles from '../../shared/common.styles';
import {isEmpty, roundToDecimalPlaces, toDegrees, toRadians} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR, WARNING_COLOR} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SaveAndCloseButton from '../../shared/ui/SaveAndCloseButtons';
import SectionDivider from '../../shared/ui/SectionDivider';
import {COMPASS_TOGGLE_BUTTONS} from '../compass/compass.constants';
import {setCompassMeasurements, setCompassMeasurementTypes} from '../compass/compass.slice';
import {Form, useFormHook} from '../form';
import {setModalVisible} from '../home/home.slice';
import {MODAL_KEYS} from '../page/page.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties, setSelectedAttributes} from '../spots/spots.slice';

const MeasurementDetail = ({
                             closeDetailView,
                             deleteTemplate,
                             selectedAttitudes,
                             saveTemplate,
                           }) => {
  const dispatch = useDispatch();
  const compassMeasurements = useSelector(state => state.compass.measurements);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const useForm = useFormHook();
  const useMeasurements = useMeasurementsHook();

  const formRef = useRef(null);

  const [formName, setFormName] = useState([]);
  const [isAddingAssociatedMeasurementAfterSave, setIsAddingAssociatedMeasurementAfterSave] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);

  const isTemplate = saveTemplate;
  const selectedAttitude = selectedAttributes?.length > 0 ? JSON.parse(JSON.stringify(selectedAttributes[0]))
    : isTemplate ? selectedAttitudes[0]
      : {};

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

  const addAssociatedMeasurement = () => {
    const types = selectedAttitude.type === 'linear_orientation' ? [COMPASS_TOGGLE_BUTTONS.PLANAR]
      : [COMPASS_TOGGLE_BUTTONS.LINEAR];
    dispatch(setCompassMeasurementTypes(types));
    dispatch(setModalVisible({modal: MODAL_KEYS.NOTEBOOK.MEASUREMENTS}));
  };

  const calcTrendPlunge = (value) => {
    console.log('Calculating trend and plunge...');
    const strike = selectedAttitude.strike;
    const dip = selectedAttitude.dip;
    const rake = value;
    let trend;
    const beta = toDegrees(Math.atan(Math.tan(toRadians(rake)) * Math.cos(toRadians(dip))));
    if (rake <= 90) trend = strike + beta;
    else {
      trend = 180 + strike + beta;
      if (trend >= 360) trend = trend - 360;
    }
    const plunge = toDegrees(Math.asin(Math.sin(toRadians(dip)) * Math.sin(toRadians(rake))));
    formRef.current.setFieldValue('trend', roundToDecimalPlaces(trend, 0));
    formRef.current.setFieldValue('plunge', roundToDecimalPlaces(plunge, 0));
  };

  const cancelFormAndGo = () => {
    setSelectedMeasurement({});
    formRef.current?.resetForm();
    if (isEmptyMeasurement(selectedAttitude)) {
      const aOs = selectedAttitude.associated_orientation || [];
      useMeasurements.deleteMeasurements([...aOs, selectedAttitude]);
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
      useMeasurements.deleteMeasurements([selectedMeasurement]);
      closeDetailView();
    }
    catch (e) {
      console.log('Unable to delete measurement.');
    }
  };

  const isEmptyMeasurement = (measurement) => {
    return isEmpty(measurement)
      || (!isEmpty(measurement) && ((Object.keys(measurement).length === 2 && measurement.id && measurement.type)
        || (Object.keys(measurement).length === 3 && measurement.id && measurement.type
          && measurement.associated_orientation
          && isEmpty(measurement.associated_orientation.filter(aO => !isEmptyMeasurement(aO))))));
  };

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

  const onMyChange = async (name, value) => {
    //console.log(name, 'changed to', value);
    if (name === 'rake' && !isEmpty(value) && selectedMeasurement.type === 'linear_orientation'
      && selectedAttitude.id !== selectedMeasurement.id && !isEmpty(selectedAttitude.strike)
      && !isEmpty(selectedAttitude.dip) && value >= 0 && value <= 180) calcTrendPlunge(value);
    await formRef.current.setFieldValue(name, value);
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

  const renderAssociatedMeasurements = () => {
    const addButtonText = selectedAttitude && selectedAttitude.type === 'linear_orientation'
      ? '+ Add Associated Plane' : '+ Add Associated Line';
    console.log('selected id', selectedMeasurement.id);
    return (
      <View>
        {/* Primary measurement */}
        {selectedMeasurement && selectedAttitude && selectedAttitude.associated_orientation && (
          <React.Fragment>
            <MeasurementItem
              item={selectedAttitude}
              selectedIds={[selectedMeasurement.id]}
              isDetail={true}
              onPress={() => onSwitchSelectedMeasurement(selectedAttitude)}
            />
            <FlatListItemSeparator/>
          </React.Fragment>
        )}

        {/* Associated measurements */}
        {selectedMeasurement && selectedAttitude && selectedAttitude.associated_orientation
          && (selectedAttitude.associated_orientation.map((item, i) =>
              <React.Fragment key={item.id + 'Outer'}>
                <MeasurementItem
                  item={item}
                  selectedIds={[selectedMeasurement.id]}
                  onPress={() => onSwitchSelectedMeasurement(item)}
                  key={item.id}
                />
                <FlatListItemSeparator/>
              </React.Fragment>,
            )
          )}

        {/* Button to add an associated measurement */}
        <Button
          titleStyle={styles.buttonText}
          title={addButtonText}
          type={'clear'}
          onPress={() => onAddAssociatedMeasurement()}
        />
      </View>
    );
  };

  const renderCancelSaveButtons = () => {
    return (
      <View>
        <SaveAndCloseButton
          cancel={() => cancelFormAndGo()}
          save={() => isTemplate ? saveTemplateForm(formRef.current) : saveFormAndGo()}
        />
      </View>
    );
  };

  const renderFormFields = () => {
    console.log('Rendering Form:', formName[0] + '.' + formName[1], '\nSelected Measurements:',
      selectedAttributes, '\nSelected Individual Measurement:', selectedMeasurement);
    return (
      <View>
        <SectionDivider dividerText={'Feature Type'}/>
        <View style={{flex: 1}}>
          <Formik
            innerRef={formRef}
            onSubmit={values => console.log('Submitting form...', values)}
            onReset={() => console.log('Resetting form...')}
            validate={values => useForm.validateForm({formName: formName, values: values})}
            initialValues={selectedMeasurement}
            enableReinitialize={true}
            initialStatus={{formName: formName}}
          >
            {formProps => <Form {...{...formProps, formName: formName, onMyChange: onMyChange}}/>}
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
          pad={5}>
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
        onPress={i => onSwitchPlanarTabular(i)}
        selectedIndex={selectedMeasurement.type === 'planar_orientation' ? 0 : 1}
        buttons={['Planar Feature', 'Tabular Zone']}
        containerStyle={styles.measurementDetailSwitches}
        selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
        textStyle={{color: PRIMARY_ACCENT_COLOR}}
      />
    );
  };

  const saveForm = async (formCurrent) => {
    try {
      await formCurrent.submitForm();
      let formValues = useForm.showErrors(formRef.current || formCurrent, isEmpty(formRef.current));
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
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'orientation_data', value: orientationDataCopy}));
      await formCurrent.resetForm();
      console.log('Finished saving form data to Spot');
    }
    catch (e) {
      console.log('Error submitting form.', e);
      return Promise.reject();
    }
  };

  const saveFormAndGo = async () => {
    try {
      await saveForm(formRef.current);
      closeDetailView();
    }
    catch (e) {
      console.log('Error saving form data to Spot');
    }
  };

  const saveFormAndAddAssociatedMeasurement = async () => {
    try {
      setIsAddingAssociatedMeasurementAfterSave(true);
      await saveForm(formRef.current);
    }
    catch (e) {
      console.log('Error saving form data to Spot');
    }
  };

  const saveFormAndSwitchSelectedMeasurement = async (measurement) => {
    try {
      await saveForm(formRef.current);
      switchSelectedMeasurement(measurement);
    }
    catch (e) {
      console.log('Error saving form data to Spot');
    }
  };

  const saveTemplateForm = async (formCurrent) => {
    await formCurrent.submitForm();
    const formValues = useForm.showErrors(formRef.current || formCurrent, isEmpty(formRef.current));
    await saveTemplate(formValues);
  };

  // Switch the selected measurement
  const switchSelectedMeasurement = (measurement) => {
    setSelectedMeasurement(measurement);
    let formCategory = selectedAttributes.length === 1 && !isTemplate ? 'measurement' : 'measurement_bulk';
    setFormName([formCategory, measurement.type]);
  };

  // Switch between Planar and Tabular Zone
  const switchPlanarTabular = (type) => {
    const modifiedMeasurement = {...formRef.current.values, type: type};
    switchSelectedMeasurement(modifiedMeasurement);
  };

  return (
    <React.Fragment>
      {selectedMeasurement && (
        <View style={styles.measurementsContentContainer}>
          {renderCancelSaveButtons()}
          <FlatList
            ListHeaderComponent={
              <View>
                {!isTemplate && selectedMeasurement && selectedAttributes.length === 1 && renderAssociatedMeasurements()}
                {!isTemplate && selectedMeasurement && selectedAttributes.length > 1 && renderMultiMeasurementsBar()}
                {selectedMeasurement && selectedMeasurement.type && (selectedMeasurement.type === 'planar_orientation'
                  || selectedMeasurement.type === 'tabular_orientation') && renderPlanarTabularSwitches()}
                <View>
                  {!isEmpty(formName) && renderFormFields()}
                </View>
                {selectedAttributes.length === 1 && (
                  <Button
                    titleStyle={{color: WARNING_COLOR}}
                    title={isTemplate ? 'Delete Measurement Template' : 'Delete Measurement'}
                    type={'clear'}
                    onPress={() => isTemplate ? deleteTemplate() : confirmDeleteMeasurement()}
                  />
                )}
              </View>
            }
          />
        </View>
      )}
    </React.Fragment>
  );
};

export default MeasurementDetail;
