import React from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field} from 'formik';

import commonStyles from '../../shared/common.styles';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import {NumberInputField} from '../form';
import useMapLocation from '../maps/view/useMapLocation';

const GeoFieldsInputs = ({formRef, geomFormRef, isReadOnly}) => {
  /* Data Hooks */

  const {getCurrentLocation} = useMapLocation();

  /* Logic Helpers */

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

  /* View */

  return (
    <ListItem containerStyle={commonStyles.listItemFormField}>
      <ListItem.Content>
        <View style={{flex: 1, flexDirection: 'row'}}>
          <View style={{flex: 1, flexDirection: 'row', overflow: 'hidden'}}>
            <View style={{flex: 1, paddingRight: 5}}>
              <Field
                component={NumberInputField}
                editable={!isReadOnly}
                key={'longitude'}
                label={'Longitude'}
                name={'longitude'}
              />
            </View>
            <View style={{flex: 1}}>
              <Field
                component={NumberInputField}
                editable={!isReadOnly}
                key={'latitude'}
                label={'Latitude'}
                name={'latitude'}
              />
            </View>
          </View>
          {!isReadOnly && (
            <ClearButton
              icon={{
                name: 'locate',
                type: 'ionicon',
                size: 30,
                color: commonStyles.iconColor.color,
              }}
              onPress={fillWithCurrentLocation}
            />
          )}
        </View>
      </ListItem.Content>
    </ListItem>
  );
};

export default GeoFieldsInputs;
