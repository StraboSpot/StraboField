import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {
  LINEAR_FORM_NAME,
  MANUAL_LABEL_KEY,
  MANUAL_LINEAR_KEYS,
  MANUAL_PLANAR_KEYS,
  MANUAL_QUALITY_KEY,
  MEASUREMENT_KEYS,
  PLANAR_FORM_NAME,
} from './measurements.constants';
import commonStyles from '../../shared/common.styles';
import SliderBar from '../../shared/ui/SliderBar';
import {setOrientationFieldValue} from '../compass/compass.helpers';
import compassStyles from '../compass/compass.styles';
import {Form, useForm} from '../form';

const AddManualMeasurements = ({formProps, measurementType, formRefCurrent}) => {
  /* Data Hooks */

  const {getSurvey} = useForm();

  /* Local State */

  const [sliderValue, setSliderValue] = useState(6);

  /* Derived Variables */

  // Relevant fields for quick-entry modal
  const planarSurvey = getSurvey(PLANAR_FORM_NAME);
  const labelField = planarSurvey.find(f => f.name === MANUAL_LABEL_KEY);
  const linearSurvey = getSurvey(LINEAR_FORM_NAME);
  const linearKeysFields = MANUAL_LINEAR_KEYS.map(k => linearSurvey.find(f => f.name === k));
  const planarKeysFields = MANUAL_PLANAR_KEYS.map(k => planarSurvey.find(f => f.name === k));

  /* Side Effects */

  useEffect(() => {
    console.log('UE AddManualMeasurements [sliderValue]', sliderValue);
    const sliderValueString = sliderValue <= 5 ? sliderValue.toString() : undefined;
    formProps.setFieldValue(MANUAL_QUALITY_KEY, sliderValueString);
    if (measurementType === MEASUREMENT_KEYS.PLANAR_LINEAR) {
      formProps.setFieldValue('associated_orientation[0].' + MANUAL_QUALITY_KEY, sliderValueString);
    }
  }, [sliderValue]);

  /* Event Handlers */

  // Entering a strike fills in the dip direction and the reverse
  const setFieldValueAndPairedOrientation = (name, value) => setOrientationFieldValue(formRefCurrent, name, value);

  /* View */

  return (
    <>
      <Form {...formProps} formName={PLANAR_FORM_NAME} surveyFragment={[labelField]}/>
      <>
        {(measurementType === MEASUREMENT_KEYS.PLANAR || measurementType === MEASUREMENT_KEYS.PLANAR_LINEAR) && (
          <Form
            {...formProps}
            formName={PLANAR_FORM_NAME}
            setNumberFieldValueOverride={setFieldValueAndPairedOrientation}
            surveyFragment={planarKeysFields}
          />
        )}
        {(measurementType === MEASUREMENT_KEYS.LINEAR || measurementType === MEASUREMENT_KEYS.PLANAR_LINEAR) && (
          <Form
            {...formProps}
            formName={LINEAR_FORM_NAME}
            subkey={measurementType === MEASUREMENT_KEYS.PLANAR_LINEAR && 'associated_orientation'}
            surveyFragment={linearKeysFields}
          />
        )}
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
    </>
  );
};

export default AddManualMeasurements;
