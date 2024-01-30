import React from 'react';
import {Text, View} from 'react-native';

import {Button} from 'react-native-elements';
import {useDispatch} from 'react-redux';

import {formStyles, useFormHook} from '.';
import {isEmpty, padWithLeadingZeros} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR, SECONDARY_BACKGROUND_COLOR, SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import {COMPASS_TOGGLE_BUTTONS} from '../compass/compass.constants';
import {setCompassMeasurementTypes} from '../compass/compass.slice';

const MeasurementButtons = ({
                                               formProps,
                                               measurementsKeys,
                                               setIsMeasurementsModalVisible,
                                               setMeasurementsGroupField,
                                               survey,
                                             }) => {
  const dispatch = useDispatch();

  const useForm = useFormHook();

  const groupFields = Object.keys(measurementsKeys).map(k => survey.find(f => f.name === k));

  const addMeasurement = (groupField) => {
    setIsMeasurementsModalVisible(true);
    setMeasurementsGroupField(groupField);
    const groupKeys = measurementsKeys[groupField.name];
    if (groupKeys.strike) dispatch(setCompassMeasurementTypes([COMPASS_TOGGLE_BUTTONS.PLANAR]));
    else dispatch(setCompassMeasurementTypes([COMPASS_TOGGLE_BUTTONS.LINEAR]));
  };

  const isGroupEmpty = (groupField) => {
    const relevantFields = useForm.getGroupFields(survey, groupField.name);
    return !relevantFields.some(f => !isEmpty(formProps.values[f.name]));
  };

  const buttonText = (field) => {
    const getValueText = () => {
      const values = formProps.values;
      const groupKeys = measurementsKeys[field.name];
      if (groupKeys.strike) {
        const strike = values[groupKeys.strike];
        const dip = values[groupKeys.dip];
        return (isEmpty(strike) ? '?' : padWithLeadingZeros(strike, 3)) + '/'
          + (isEmpty(dip) ? '?' : padWithLeadingZeros(dip, 2));
      }
      else {
        const plunge = values[groupKeys.plunge];
        const trend = values[groupKeys.trend];
        return (isEmpty(plunge) ? '?' : padWithLeadingZeros(plunge, 2)) + '\u2192'
          + (isEmpty(trend) ? '?' : padWithLeadingZeros(trend, 3));
      }
    };

    return (
      <View style={{flex: 1, alignItems: 'center'}}>
        <Text
          style={[isGroupEmpty(field) ? formStyles.formButtonTitle : formStyles.formButtonSelectedTitle,
            {fontSize: groupFields.length === 1 ? SMALL_TEXT_SIZE : 10, textAlign: 'center'}]}
        >
          {field.label}
        </Text>
        {!isGroupEmpty(field) && (
          <Text style={[formStyles.formButtonSelectedTitle, {
            fontSize: groupFields.length === 1 ? SMALL_TEXT_SIZE : 10,
            textAlign: 'center',
            fontWeight: 'bold',
          }]}>
            {getValueText()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', paddingLeft: 10, paddingRight: 10}}>
      {groupFields.map((field) => {
        return (
          <Button
            key={field.name}
            containerStyle={{flex: 1, padding: 2}}
            buttonStyle={[formStyles.formButtonSmall, {
              height: 60,
              backgroundColor: isGroupEmpty(field) ? SECONDARY_BACKGROUND_COLOR : PRIMARY_ACCENT_COLOR,
              padding: 1,
            }]}
            title={() => buttonText(field)}
            type={'outline'}
            onPress={() => addMeasurement(field)}
          />
        );
      })}
    </View>
  );
};

export default MeasurementButtons;
