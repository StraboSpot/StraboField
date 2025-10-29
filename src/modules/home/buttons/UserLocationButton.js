import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useSelector} from 'react-redux';

import IconButton from '../../../shared/ui/buttons/IconButton';

const UserLocationButton = ({clickHandler}) => {
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const stratSection = useSelector(state => state.map.stratSection);

  const [userLocationButtonOn, setUserLocationButtonOn] = useState(false);

  const toast = useToast();

  let timeout;

  useEffect(() => {
    // console.log('UE LeftSideButtons [userLocationButtonOn]', userLocationButtonOn);
    if (userLocationButtonOn) startLocationReminderTimer();
    return () => clearTimeout(timeout);
  }, [userLocationButtonOn]);

  const clearLocationTimer = () => {
    setUserLocationButtonOn(false);
    clickHandler('toggleUserLocation', false);
    toast.show('Geolocation turned off automatically to conserve battery.');
    // console.log('Location timer cleared');
  };

  const startLocationReminderTimer = () => {
    timeout = setTimeout(() => {
      // console.log(timeout);
      clearLocationTimer();
    }, 180000);
  };

  if (!currentImageBasemap && !stratSection) {
    return (
      <IconButton
        onPress={() => {
          setUserLocationButtonOn(!userLocationButtonOn);
          clickHandler('toggleUserLocation', !userLocationButtonOn);
        }}
        source={userLocationButtonOn
          ? require('../../../assets/icons/MyLocationButton_pressed.png')
          : require('../../../assets/icons/MyLocationButton.png')}
      />
    );
  }
  else return <View/>;  // Added so 'space-between' would work correctly for DrawInfo when no UserLocationButton
};

export default UserLocationButton;
