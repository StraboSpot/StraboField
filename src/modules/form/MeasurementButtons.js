import React from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import {formStyles, useForm} from '.';
import {isEmpty, padWithLeadingZeros} from '../../shared/helpers';
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
  /* Data Hooks */

  const dispatch = useDispatch();

  const {getGroupFields} = useForm();

  /* Derived Variables */

  const groupFields = Object.keys(measurementsKeys).map(k => survey.find(f => f.name === k));

  /* Logic Helpers */

  const addMeasurement = (groupField) => {
    setIsMeasurementsModalVisible(true);
    setMeasurementsGroupField(groupField);
    const groupKeys = measurementsKeys[groupField.name];
    if (groupKeys.strike) dispatch(setCompassMeasurementTypes([COMPASS_TOGGLE_BUTTONS.PLANAR]));
    else dispatch(setCompassMeasurementTypes([COMPASS_TOGGLE_BUTTONS.LINEAR]));
  };

  const isGroupEmpty = (groupField) => {
    const relevantFields = getGroupFields(survey, groupField.name);
    return !relevantFields.some(f => !isEmpty(formProps.values[f.name]));
  };

  /* Render Functions */

  const renderButtonText = (field) => {
    const getValueText = () => {
      const groupKeys = measurementsKeys[field.name];
      if (groupKeys.strike) {
        const strike = formProps.values[groupKeys.strike];
        const dip = formProps.values[groupKeys.dip];
        return (isEmpty(strike) ? '?' : padWithLeadingZeros(strike, 3)) + '/'
          + (isEmpty(dip) ? '?' : padWithLeadingZeros(dip, 2));
      }
      else {
        const plunge = formProps.values[groupKeys.plunge];
        const trend = formProps.values[groupKeys.trend];
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

  /* View */

  return (
    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', paddingLeft: 10, paddingRight: 10}}>
      {groupFields.map((field) => {
        return (
          <Button
            buttonStyle={[formStyles.formButtonSmall, {
              backgroundColor: isGroupEmpty(field) ? SECONDARY_BACKGROUND_COLOR : PRIMARY_ACCENT_COLOR,
              height: 60,
              padding: 1,
            }]}
            containerStyle={{flex: 1, padding: 2}}
            key={field.name}
            onPress={() => addMeasurement(field)}
            title={renderButtonText(field)}
            type={'outline'}
          />
        );
      })}
    </View>
  );
};

export default MeasurementButtons;
