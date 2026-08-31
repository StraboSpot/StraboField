import React, {useState} from 'react';
import {Platform, ScrollView, Text, useWindowDimensions, View} from 'react-native';

import {useSelector} from 'react-redux';

import {useForm} from '.';
import {getConstraintError} from './form.helpers';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SliderBar from '../../shared/ui/SliderBar';
import Compass from '../compass/Compass';
import {ENLARGED_COMPASS_MODAL_MAX_HEIGHT, getEnlargedCompassModalWidth} from '../compass/compass.constants';
import compassStyles from '../compass/compass.styles';
import CompassControls from '../compass/CompassControls';
import ManualMeasurement from '../compass/ManualMeasurement';

const MeasurementModal = ({
                            formName,
                            formProps,
                            measurementsGroup,
                            measurementsGroupLabel,
                            setIsMeasurementModalVisible,
                          }) => {
  /* Data Hooks */

  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);
  const defaultManualMeasurement = useSelector(state => state.user.default_manual_measurement);
  const isCompassEnlarged = useSelector(state => state.compass.isCompassEnlarged);

  const {height, width} = useWindowDimensions();

  const {getChoices, getChoicesByKey, getSurvey} = useForm();

  /* Local State */

  const [isManualMeasurement, setIsManualMeasurement] = useState(defaultManualMeasurement ?? (Platform.OS !== 'ios'));
  const [sliderValue, setSliderValue] = useState(6);

  /* Derived Variables */

  // The group pairs each compass key with the attribute field it writes to. Quality is in it but is a slider here
  // rather than one of the manual fields, so it takes no seed value and has nothing to validate.
  const manualFieldEntries = Object.entries(measurementsGroup).filter(
    ([compassFieldKey]) => compassFieldKey !== 'quality');

  // Reopening the modal shows the measurement already on the attribute, keyed the way the manual fields are named
  const manualMeasurementValues = manualFieldEntries.reduce((acc, [compassFieldKey, groupFieldKey]) => {
    if (isEmpty(formProps.values[groupFieldKey])) return acc;
    return {...acc, [compassFieldKey]: formProps.values[groupFieldKey]};
  }, {});

  /* Logic Helpers */

  const addAttributeMeasurement = (data) => {
    const sliderQuality = sliderValue ? {quality: sliderValue.toString()} : undefined;
    setMeasurements({...data, ...sliderQuality});
    setIsMeasurementModalVisible(false);
  };

  const setMeasurements = (compassData) => {
    let renamedCompassData = {};
    if (isEmpty(compassData)) {
      let updatedFormData = JSON.parse(JSON.stringify(formProps.values));
      Object.values(measurementsGroup).forEach((k) => {
        if (isEmpty(compassData) && updatedFormData[k]) delete updatedFormData[k];
      });
      formProps.setValues(updatedFormData);
      setIsMeasurementModalVisible(false);
    }
    else {
      Object.entries(measurementsGroup).forEach(([compassFieldKey, foldFieldKey]) => {
        if (!isEmpty(compassData[compassFieldKey])) {
          // Convert quality to choice names for fold group, assumes qualities listed highest to lowest
          if (compassFieldKey === 'quality') {
            const survey = getSurvey(formName);
            const choices = getChoices(formName);
            const qualityChoices = getChoicesByKey(survey, choices, foldFieldKey);
            const choiceNum = Math.round(parseInt(compassData[compassFieldKey], 10) / 5 * qualityChoices.length);
            renamedCompassData[foldFieldKey] = qualityChoices.reverse()[choiceNum - 1]?.name;
          }
          else renamedCompassData[foldFieldKey] = compassData[compassFieldKey];
        }
      });
      formProps.setValues({...formProps.values, ...renamedCompassData});
    }
  };

  // The manual fields are named by compass key while the constraints live on the attribute's own fields, so check
  // each value against the field it will be written to and report the error back under the name shown here
  const validateMeasurement = (values) => {
    const survey = getSurvey(formName);
    return manualFieldEntries.reduce((acc, [compassFieldKey, groupFieldKey]) => {
      const fieldModel = survey.find(f => f.name === groupFieldKey);
      if (!fieldModel || isEmpty(values[compassFieldKey])) return acc;
      const constraintError = getConstraintError(fieldModel, values[compassFieldKey]);
      return constraintError ? {...acc, [compassFieldKey]: constraintError} : acc;
    }, {});
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={() => setIsMeasurementModalVisible(false)}
      headerTitle={measurementsGroupLabel}
      overlayStyleOverride={isCompassEnlarged && !isManualMeasurement
        ? {maxHeight: ENLARGED_COMPASS_MODAL_MAX_HEIGHT, width: getEnlargedCompassModalWidth(width, height)}
        : undefined}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton
    >
      <ScrollView>
        {isManualMeasurement ? (
          <>
            <CompassControls
              isManual={isManualMeasurement}
              onToggleManual={setIsManualMeasurement}
              showManualToggle={Platform.OS === 'ios'}
            />
            <ManualMeasurement
              addAttributeMeasurement={addAttributeMeasurement}
              initialValues={manualMeasurementValues}
              measurementTypes={compassMeasurementTypes}
              setAttributeMeasurements={setMeasurements}
              setSliderValue={setSliderValue}
              sliderValue={sliderValue}
              validate={validateMeasurement}
            />
          </>
        ) : (
          <>
            <View style={compassStyles.compassSection}>
              <CompassControls
                isManual={isManualMeasurement}
                onToggleManual={setIsManualMeasurement}
                showManualToggle={Platform.OS === 'ios'}
              />
              <Compass
                closeCompass={() => setIsMeasurementModalVisible(false)}
                setAttributeMeasurements={setMeasurements}
                sliderValue={sliderValue}
              />
            </View>
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
      </ScrollView>
      <ClearButton
        onPress={() => setMeasurements({})}
        title={'Clear Measurement'}
      />
    </ModalWrapper>
  );
};

export default MeasurementModal;
