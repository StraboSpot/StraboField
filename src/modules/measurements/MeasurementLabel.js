import React from 'react';
import {Text} from 'react-native';

import {useSelector} from 'react-redux';

import {MEASUREMENT_KEYS} from './measurements.constants';
import {getMeasurementTypeText, isPlanarType} from './measurements.helpers';
import {isEmpty, padWithLeadingZeros} from '../../shared/helpers';
import useForm from '../form/useForm';

const MeasurementLabel = ({isDetail, item}) => {
  /* Data Hooks */

  const measurementConvention = useSelector(state => state.user?.measurement_convention);

  const {getLabel} = useForm();

  /* Logic Helpers */

  const getMeasurementText = (measurement) => {
    let measurementText = '';
    if (isPlanarType(measurement.type)) {
      if (measurementConvention === 'dip_direction_dip') {
        measurementText
          += (isEmpty(measurement.dip_direction) ? '?' : padWithLeadingZeros(measurement.dip_direction, 3)) + '/'
          + (isEmpty(measurement.dip) ? '?' : padWithLeadingZeros(measurement.dip, 2));
      }
      else {
        measurementText += (isEmpty(measurement.strike) ? '?' : padWithLeadingZeros(measurement.strike, 3)) + '/'
          + (isEmpty(measurement.dip) ? '?' : padWithLeadingZeros(measurement.dip, 2));
      }
    }
    if (measurement.type === MEASUREMENT_KEYS.LINEAR) {
      measurementText += (isEmpty(measurement.plunge) ? '?' : padWithLeadingZeros(measurement.plunge, 2)) + '\u2192'
        + (isEmpty(measurement.trend) ? '?' : padWithLeadingZeros(measurement.trend, 3));
    }
    return measurementText === '' ? '?' : measurementText;
  };

  // The orientation numbers are always read off the measurement, so they keep following the measurement
  // convention setting; a label only ever stands in for the descriptive half
  const getTypeText = measurement => measurement.label || getMeasurementTypeText(measurement, getLabel);

  /* View */

  return (
    <>
      <Text>{getMeasurementText(item)} {getTypeText(item)}</Text>
      {!isDetail && item.associated_orientation && item.associated_orientation.map((ao) => {
        return <Text key={JSON.stringify(ao)}>{'\n'}{getMeasurementText(ao)} {getTypeText(ao)}</Text>;
      })}
    </>
  );
};

export default MeasurementLabel;
