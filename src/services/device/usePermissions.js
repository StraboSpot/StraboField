import {Platform} from 'react-native';

import DeviceInfo from 'react-native-device-info';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';

import alert from '../../shared/ui/alert';

// Semantic feature -> platform-specific permission + user-facing messaging.
// A null permission means the platform needs no runtime permission for that feature.
const PERMISSION_CONFIG = {
  camera: {
    android: PERMISSIONS.ANDROID.CAMERA,
    ios: PERMISSIONS.IOS.CAMERA,
    blocked: ['Camera Permission Denied',
      'To take photos, allow camera access in Settings -> Apps -> StraboSpot2 -> Camera.'],
    unavailable: ['Camera Unavailable', 'The camera is not available on this device.'],
  },
  location: {
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    blocked: ['Location Permission Denied',
      'To use your location, allow location access in Settings -> Apps -> StraboSpot2 -> Location.'],
    unavailable: ['Location Unavailable', 'Location services are not available on this device.'],
  },
  storage: {
    android: PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
    ios: null,  // iOS uses the app sandbox; no runtime storage permission is needed
    blocked: ['Storage Permission Denied',
      'To save files, allow storage access in Settings -> Apps -> StraboSpot2 -> Files and media.'],
    unavailable: ['Storage Unavailable', 'Storage access is not available on this device.'],
  },
};

const usePermissions = () => {
  /* Internal Functions */

  // Runs the check -> request -> alert flow for a semantic feature. Returns true if usable.
  const requestPermissionForFeature = async (feature) => {
    const config = PERMISSION_CONFIG[feature];
    if (!config) throw Error(`Unknown permission feature: ${feature}`);

    const permission = Platform.OS === 'ios' ? config.ios : config.android;
    if (!permission) return true;  // No runtime permission on this platform (e.g. iOS storage).

    // Android 13+ drops the legacy external-storage permissions; they are effectively granted.
    if (feature === 'storage' && Platform.OS === 'android' && DeviceInfo.getSystemVersion() >= 13) return true;

    let status = await check(permission);
    if (status === RESULTS.DENIED) status = await request(permission);
    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) return true;
    if (status === RESULTS.BLOCKED) alert(...config.blocked);
    else if (status === RESULTS.UNAVAILABLE) alert(...config.unavailable);
    return false;
  };

  /* Exported Functions */

  const hasCameraPermission = () => requestPermissionForFeature('camera');

  const hasLocationPermission = () => requestPermissionForFeature('location');

  const hasStoragePermission = () => requestPermissionForFeature('storage');

  return {
    hasCameraPermission,
    hasLocationPermission,
    hasStoragePermission,
  };
};

export default usePermissions;
