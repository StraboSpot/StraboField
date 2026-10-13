import React, {useState} from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';

import commonStyles from '../../shared/common.styles';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import NumberInputField from '../form/inputs/NumberInputField';
import useMapLocation from '../maps/view/useMapLocation';

const GeoFieldsInputs = ({formRef, geomFormRef, isReadOnly}) => {
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
    // A fix can take up to 30 seconds, long enough to have left the page and taken its forms with it
    const geomForm = geomFormRef.current;
    const form = formRef?.current;
    if (!geomForm) return;
    if (currentLocation.latitude) geomForm.setFieldValue('latitude', currentLocation.latitude);
    if (currentLocation.longitude) geomForm.setFieldValue('longitude', currentLocation.longitude);
    if (form) {
      if (currentLocation.altitude) form.setFieldValue('altitude', currentLocation.altitude);
      if (currentLocation.accuracy) form.setFieldValue('gps_accuracy', currentLocation.accuracy);
      if (currentLocation.altitudeAccuracy) form.setFieldValue('altitude_accuracy', currentLocation.altitudeAccuracy);
    }
  };

  /* View */

  return (
    <ListItem containerStyle={commonStyles.listItemFormField}>
      <ListItem.Content>
        <View style={{flex: 1, flexDirection: 'row'}}>
          <View style={{flex: 1, flexDirection: 'row', overflow: 'hidden'}}>
            <View style={{flex: 1, paddingRight: 5}}>
              <NumberInputField
                editable={!isReadOnly}
                label={'Longitude'}
                name={'longitude'}
              />
            </View>
            <View style={{flex: 1}}>
              <NumberInputField
                editable={!isReadOnly}
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
              isLoading={isGettingLocation}
              onPress={fillWithCurrentLocation}
            />
          )}
        </View>
      </ListItem.Content>
    </ListItem>
  );
};

export default GeoFieldsInputs;
