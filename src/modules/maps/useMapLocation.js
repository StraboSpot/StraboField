import {Platform} from 'react-native';

import Geolocation from '@react-native-community/geolocation';
import * as turf from '@turf/turf';
import {useDispatch} from 'react-redux';

import {useSpots} from '../spots';
import {setSelectedSpot} from '../spots/spots.slice';

const useMapLocation = () => {
  const {createRandomSpots, createSpot} = useSpots();
  const dispatch = useDispatch();

  const generateRandomsSpotsAroundCurrentLocation = async (numRandomSpots) => {
    const currentLocation = await getCurrentLocation();
    let feature = turf.point([currentLocation.longitude, currentLocation.latitude]);
    createRandomSpots(feature, numRandomSpots);
  };

  // Get the current location from the device and set it in the state
  const getCurrentLocation = async () => {
    if (Platform.OS !== 'web') {
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        locationProvider: Platform.OS === 'ios' ? null : 'playServices',
      });
    }

    const geolocationOptions = {timeout: 15000, maximumAge: 10000, enableHighAccuracy: Platform.OS === 'ios'};
    return (
      new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            console.log('Got Current Location: [', position.coords.longitude, ', ', position.coords.latitude, ']');
            resolve(position.coords);
          },
          error => reject('Error getting current location: ' + (error.message ? error.message : 'Unknown Error')),
          geolocationOptions,
        );
      })
    );
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
    return newSpot;
  };

  return {
    generateRandomsSpotsAroundCurrentLocation: generateRandomsSpotsAroundCurrentLocation,
    getCurrentLocation: getCurrentLocation,
    setPointAtCurrentLocation: setPointAtCurrentLocation,
  };
};

export default useMapLocation;
