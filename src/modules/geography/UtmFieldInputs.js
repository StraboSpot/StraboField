import React, {useState} from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';

import {GEOMETRY_FIELD_LABELS} from './geography.constants';
import commonStyles from '../../shared/common.styles';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import NumberInputField from '../form/inputs/NumberInputField';
import TextInputField from '../form/inputs/TextInputField';
import {convertLatLngToUtm} from '../maps/maps.helpers';
import useMapLocation from '../maps/view/useMapLocation';

const UtmFieldInputs = ({formRef, isReadOnly}) => {
  /* Data Hooks */

  const {getCurrentLocation} = useMapLocation();

  /* Local State */

  const [isGettingLocation, setIsGettingLocation] = useState(false);

  /* Logic Helpers */

  const fillWithCurrentLocation = async () => {
    let currentLocation;
    setIsGettingLocation(true);
    try {
      currentLocation = await getCurrentLocation();
    }
    finally {
      setIsGettingLocation(false);
    }
    // A fix can take up to 30 seconds, long enough to have left the page and taken its form with it
    const form = formRef.current;
    if (!form) return;
    if (currentLocation.latitude && currentLocation.longitude) {
      const {easting, northing, zone} = convertLatLngToUtm([currentLocation.longitude, currentLocation.latitude]);
      form.setFieldValue('utm_zone', zone);
      form.setFieldValue('easting', easting);
      form.setFieldValue('northing', northing);
    }
    if (currentLocation.altitude) form.setFieldValue('altitude', currentLocation.altitude);
    if (currentLocation.accuracy) form.setFieldValue('gps_accuracy', currentLocation.accuracy);
    if (currentLocation.altitudeAccuracy) form.setFieldValue('altitude_accuracy', currentLocation.altitudeAccuracy);
  };

  /* View */

  return (
    <>
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <TextInputField
            autoCapitalize={'characters'}
            editable={!isReadOnly}
            label={GEOMETRY_FIELD_LABELS.utm_zone + ' (e.g. 13N)'}
            name={'utm_zone'}
          />
        </ListItem.Content>
      </ListItem>
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <View style={{flex: 1, flexDirection: 'row'}}>
            <View style={{flex: 1, flexDirection: 'row', overflow: 'hidden'}}>
              <View style={{flex: 1, paddingRight: 5}}>
                <NumberInputField
                  editable={!isReadOnly}
                  label={GEOMETRY_FIELD_LABELS.easting}
                  name={'easting'}
                />
              </View>
              <View style={{flex: 1}}>
                <NumberInputField
                  editable={!isReadOnly}
                  label={GEOMETRY_FIELD_LABELS.northing}
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
                isLoading={isGettingLocation}
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
