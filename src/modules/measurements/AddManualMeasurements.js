import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {MEASUREMENT_KEYS} from './measurements.constants';
import commonStyles from '../../shared/common.styles';
import SliderBar from '../../shared/ui/SliderBar';
import compassStyles from '../compass/compass.styles';
import useCompassCalculations from '../compass/useCompassCalculations';
import {Form, useForm} from '../form';

const AddManualMeasurements = ({formProps, measurementType}) => {
  const {getSurvey} = useForm();

  const [sliderValue, setSliderValue] = useState(6);

  const groupKey = 'measurement';

  // Relevant keys for quick-entry modal
  const labelKey = 'label';
  const planarKeys = ['strike', 'dip_direction', 'dip'];
  const linearKeys = ['trend', 'plunge', 'rake'];
  const qualityKey = 'quality';

  // Relevant fields for quick-entry modal
  const planarFormName = [groupKey, MEASUREMENT_KEYS.PLANAR];
  const planarSurvey = getSurvey(planarFormName);
  const planarKeysFields = planarKeys.map(k => planarSurvey.find(f => f.name === k));
  const linearFormName = [groupKey, MEASUREMENT_KEYS.LINEAR];
  const linearSurvey = getSurvey(linearFormName);
  const linearKeysFields = linearKeys.map(k => linearSurvey.find(f => f.name === k));

  const labelField = planarSurvey.find(f => f.name === labelKey);

  const {onMyChange} = useCompassCalculations({formRefCurrent: formProps});

  useEffect(() => {
    console.log('UE AddManualMeasurements [sliderValue]', sliderValue);
    const sliderValueString = sliderValue <= 5 ? sliderValue.toString() : undefined;
    formProps.setFieldValue(qualityKey, sliderValueString);
    if (measurementType === MEASUREMENT_KEYS.PLANAR_LINEAR) {
      formProps.setFieldValue('associated_orientation[0].' + qualityKey, sliderValueString);
    }
  }, [sliderValue]);

  return (
    <>
      <Form {...{...formProps, formName: planarFormName, surveyFragment: [labelField]}}/>
      <>
        {(measurementType === MEASUREMENT_KEYS.PLANAR || measurementType === MEASUREMENT_KEYS.PLANAR_LINEAR) && (
          <Form {...{
            ...formProps,
            formName: planarFormName,
            surveyFragment: planarKeysFields,
            onMyChange: onMyChange,
          }}/>
        )}
        {(measurementType === MEASUREMENT_KEYS.LINEAR || measurementType === MEASUREMENT_KEYS.PLANAR_LINEAR) && (
          <Form {...{
            ...formProps,
            formName: linearFormName,
            surveyFragment: linearKeysFields,
            subkey: measurementType === MEASUREMENT_KEYS.PLANAR_LINEAR && 'associated_orientation',
          }}/>
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
