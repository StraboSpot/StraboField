import React from 'react';
import {View} from 'react-native';

import {Button, ListItem} from '@rn-vui/base';
import {Field} from 'formik';

import commonStyles from '../../shared/common.styles';
import {NumberInputField} from '../form';
import useMapLocation from '../maps/useMapLocation';

const GeoFieldsInputs = ({formRef, geomFormRef}) => {

  const {getCurrentLocation} = useMapLocation();


  const fillWithCurrentLocation = async () => {
    const currentLocation = await getCurrentLocation();
    if (currentLocation.latitude) geomFormRef.current.setFieldValue('latitude', currentLocation.latitude);
    if (currentLocation.longitude) geomFormRef.current.setFieldValue('longitude', currentLocation.longitude);
    if (formRef) {
      if (currentLocation.altitude) formRef.current.setFieldValue('altitude', currentLocation.altitude);
      if (currentLocation.accuracy) formRef.current.setFieldValue('gps_accuracy', currentLocation.accuracy);
      if (currentLocation.altitudeAccuracy) {
        formRef.current.setFieldValue('altitude_accuracy', currentLocation.altitudeAccuracy);
      }
    }
  };

  return (
    <ListItem containerStyle={commonStyles.listItemFormField}>
      <ListItem.Content>
        <View style={{flex: 1, flexDirection: 'row'}}>
          <View style={{flex: 1, flexDirection: 'row', overflow: 'hidden'}}>
            <View style={{flex: 1, paddingRight: 5}}>
              <Field
                component={NumberInputField}
                name={'longitude'}
                key={'longitude'}
                label={'Longitude'}
              />
            </View>
            <View style={{flex: 1}}>
              <Field
                component={NumberInputField}
                name={'latitude'}
                key={'latitude'}
                label={'Latitude'}
              />
            </View>
          </View>
          <View>
            <Button
              onPress={fillWithCurrentLocation}
              type={'clear'}
              icon={{
                name: 'locate',
                type: 'ionicon',
                size: 30,
                color: commonStyles.iconColor.color,
              }}
            />
          </View>
        </View>
      </ListItem.Content>
    </ListItem>
  );
};

export default GeoFieldsInputs;
