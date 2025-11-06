import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useSelector} from 'react-redux';

import IconButton from '../../../shared/ui/buttons/IconButton';

const UserLocationButton = ({clickHandler}) => {
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const currentTimeout = useSelector(state => state.home.geolocationTimeout);
  const stratSection = useSelector(state => state.map.stratSection);

  const appState = useRef(AppState.currentState);
  const toast = useToast();

  const [userLocationButtonOn, setUserLocationButtonOn] = useState(false);
  const wasLocationButtonOn = useRef(false);
  const timeoutRef = useRef(null);

  const clearLocationTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setUserLocationButtonOn(false);
    clickHandler('toggleUserLocation', false);
    // console.log('Location timer cleared');
  }, [clickHandler]);

  // Handle location timer when button state changes
  useEffect(() => {
    console.log('UserLocationButton - userLocationButtonOn:', userLocationButtonOn, 'currentTimeout:', currentTimeout);

    if (userLocationButtonOn && currentTimeout) {
      // Clear any existing timer first
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Start new timer
      console.log('Starting timer for', currentTimeout, 'ms');
      timeoutRef.current = setTimeout(() => {
        console.log('Timer expired, turning off location');
        setUserLocationButtonOn(false);
        clickHandler('toggleUserLocation', false);
        toast.show('Geolocation turned off automatically to conserve battery.');
      }, currentTimeout);
    }
    else if (!userLocationButtonOn && timeoutRef.current) {
      // Clear timer when button is turned off
      console.log('Clearing timer - button turned off');
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    return () => {
      // Only clear on unmount, not on every re-render
      if (!userLocationButtonOn && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [userLocationButtonOn, currentTimeout, clickHandler, toast]);

  // Handle AppState changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');

        if (wasLocationButtonOn.current) {
          toast.show('Geolocation was turned off automatically to conserve battery.');
          wasLocationButtonOn.current = false;
        }
      }

      appState.current = nextAppState;
      console.log('AppState', appState.current);
      if (appState.current.match(/inactive|background/)) {
        console.log('App is inactive!');
        wasLocationButtonOn.current = userLocationButtonOn;
        clearLocationTimer();
        console.log('Location timer cleared');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [userLocationButtonOn, clearLocationTimer, toast]);

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
