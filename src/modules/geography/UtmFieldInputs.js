import React from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field} from 'formik';

import commonStyles from '../../shared/common.styles';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import {NumberInputField, TextInputField} from '../form';
import {convertLatLngToUtm} from '../maps/maps.helpers';
import useMapLocation from '../maps/view/useMapLocation';

const UtmFieldInputs = ({formRef, geomFormRef, isReadOnly}) => {
  /* Data Hooks */

  const {getCurrentLocation} = useMapLocation();

  /* Logic Helpers */

  const fillWithCurrentLocation = async () => {
    const currentLocation = await getCurrentLocation();
    if (currentLocation.latitude && currentLocation.longitude) {
      const {easting, northing, zone} = convertLatLngToUtm([currentLocation.longitude, currentLocation.latitude]);
      geomFormRef.current.setFieldValue('utm_zone', zone);
      geomFormRef.current.setFieldValue('easting', easting);
      geomFormRef.current.setFieldValue('northing', northing);
    }
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
    <>
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <Field
            autoCapitalize={'characters'}
            component={TextInputField}
            editable={!isReadOnly}
            key={'utm_zone'}
            label={'UTM Zone (e.g. 13N)'}
            name={'utm_zone'}
          />
        </ListItem.Content>
      </ListItem>
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <View style={{flex: 1, flexDirection: 'row'}}>
            <View style={{flex: 1, flexDirection: 'row', overflow: 'hidden'}}>
              <View style={{flex: 1, paddingRight: 5}}>
                <Field
                  component={NumberInputField}
                  editable={!isReadOnly}
                  key={'easting'}
                  label={'Easting (m)'}
                  name={'easting'}
                />
              </View>
              <View style={{flex: 1}}>
                <Field
                  component={NumberInputField}
                  editable={!isReadOnly}
                  key={'northing'}
                  label={'Northing (m)'}
                  name={'northing'}
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
    </>
  );
};

export default UtmFieldInputs;
