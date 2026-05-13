import {Platform} from 'react-native';

import * as turf from '@turf/turf';
import Geolocation from 'react-native-geolocation-service';
import {useDispatch} from 'react-redux';

import usePermissions from '../../services/device/usePermissions';
import {useSpots} from '../spots';
import {setSelectedSpot} from '../spots/spots.slice';

const useMapLocation = () => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {hasLocationPermission} = usePermissions();
  const {createRandomSpots, createSpot} = useSpots();

  /* Exported Functions */

  const generateRandomsSpotsAroundCurrentLocation = async (numRandomSpots) => {
    const currentLocation = await getCurrentLocation();
    let feature = turf.point([currentLocation.longitude, currentLocation.latitude]);
    createRandomSpots(feature, numRandomSpots);
  };

  // Get the current location from the device and set it in the state
  const getCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Got location', position.coords);
            resolve(position.coords);
          },
          (error) => {
            console.error(error);
            reject('Error getting current location: ' + (error.message ? error.message : 'Unknown Error'));
          },
          {timeout: 30000, maximumAge: 10000, enableHighAccuracy: true},
        );
      });
    }

    if (Platform.OS === 'android') {
      const permissionGranted = await hasLocationPermission();
      if (!permissionGranted) throw new Error('Location permission not granted');
    }

    const geolocationOptions = {
      enableHighAccuracy: true,
      forceRequestLocation: true,
      maximumAge: 10000,
      showLocationDialog: true,
      timeout: 30000,
    };
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('Got location', position.coords);
          resolve(position.coords);
        },
        (error) => {
          console.error(error);
          reject('Error getting current location: ' + (error.message ? error.message : 'Unknown Error'));
        },
        geolocationOptions,
      );
    });
  };

  // Create a point feature at the current location
  const setPointAtCurrentLocation = async () => {
    const currentLocation = await getCurrentLocation();
    let feature = turf.point([currentLocation.longitude, currentLocation.latitude]);
    if (currentLocation.altitude) feature.properties.altitude = currentLocation.altitude;
    if (currentLocation.accuracy) feature.properties.gps_accuracy = currentLocation.accuracy;
    const newSpot = await createSpot(feature);
    console.log('Created new Spot at current location:', newSpot);
    dispatch(setSelectedSpot(newSpot));
    return JSON.parse(JSON.stringify(newSpot));
  };

  return {
    generateRandomsSpotsAroundCurrentLocation,
    getCurrentLocation,
    setPointAtCurrentLocation,
  };
};

export default useMapLocation;
