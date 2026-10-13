import {Platform} from 'react-native';

import * as turf from '@turf/turf';
import DeviceInfo from 'react-native-device-info';
import Geolocation from 'react-native-geolocation-service';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch} from 'react-redux';

import usePermissions from '../../../services/device/usePermissions';
import {toError} from '../../../shared/helpers';
import {setSelectedSpot} from '../../spots/spots.slice';
import useSpots from '../../spots/useSpots';

const LOCATION_PERMISSION_NOT_GRANTED = 'Location permission not granted';

// Both the browser and the native geolocation report a refused permission as code 1
const getLocationError = error => new Error(error.code === 1 ? LOCATION_PERMISSION_NOT_GRANTED
  : 'Error getting current location: ' + (error.message || 'Unknown Error'));

let pendingLocationRequestsCount = 0;

// A request can put up a system dialog (the permission prompt, or Android's one to turn on location services) that
// takes the app out of the foreground. While one is pending, that isn't the user leaving the app.
export const isLocationRequestPending = () => pendingLocationRequestsCount > 0;

const useMapLocation = () => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {hasLocationPermission, isLocationPermissionGranted} = usePermissions();
  const {createRandomSpots, createSpot} = useSpots();
  const toast = useToast();

  /* Exported Functions */

  const generateRandomsSpotsAroundCurrentLocation = async (numRandomSpots) => {
    const currentLocation = await getCurrentLocation();
    let feature = turf.point([currentLocation.longitude, currentLocation.latitude]);
    createRandomSpots(feature, numRandomSpots);
  };

  // Get the current location from the device and set it in the state. Pass {showBlockedAlert: false} when the
  // caller has its own fallback for a missing fix and shouldn't surface the Settings alert (declination resolution).
  const getCurrentLocation = async ({showBlockedAlert = true} = {}) => {
    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Got location', position.coords);
            resolve(position.coords);
          },
          (error) => {
            console.error(error);
            reject(getLocationError(error));
          },
          {timeout: 30000, maximumAge: 10000, enableHighAccuracy: true},
        );
      });
    }

    pendingLocationRequestsCount++;
    try {
      // Native (iOS + Android): verify permission up front so a denial shows the
      // Settings alert from usePermissions rather than failing silently in the geolocation call.
      const permissionGranted = await hasLocationPermission({showBlockedAlert});
      if (!permissionGranted) throw new Error(LOCATION_PERMISSION_NOT_GRANTED);

      const geolocationOptions = {
        enableHighAccuracy: true,
        forceRequestLocation: true,
        maximumAge: 10000,
        showLocationDialog: true,
        timeout: 30000,
      };
      return await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            console.log('Got location', position.coords);
            resolve(position.coords);
          },
          (error) => {
            console.error(error);
            reject(getLocationError(error));
          },
          geolocationOptions,
        );
      });
    }
    finally {
      pendingLocationRequestsCount--;
    }
  };

  // Instant when location services are on and permission is granted. Otherwise it asks, which offers to turn them on
  // or grant permission, and says why if the location still can't be found. Web can't check without asking, so it
  // leaves that to the lookup that follows.
  const isLocationAvailable = async () => {
    if (Platform.OS === 'web') return true;
    if (await DeviceInfo.isLocationEnabled() && await isLocationPermissionGranted()) return true;
    try {
      await getCurrentLocation();
      return true;
    }
    catch (err) {
      showLocationError(err);
      return false;
    }
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

  // Silent when permission was refused: the user has just said no or been shown the Settings alert
  const showLocationError = (err) => {
    const {message} = toError(err);
    if (message !== LOCATION_PERMISSION_NOT_GRANTED) toast.show(message, {type: 'danger'});
  };

  return {
    generateRandomsSpotsAroundCurrentLocation,
    getCurrentLocation,
    isLocationAvailable,
    setPointAtCurrentLocation,
    showLocationError,
  };
};

export default useMapLocation;
