import {Platform} from 'react-native';

import {
  getApplicationName,
  getDeviceId,
  getManufacturerSync,
  getModel,
  getReadableVersion,
  getSystemVersion,
} from 'react-native-device-info';

import {toTitleCase} from '../../shared/helpers';

const app = `(${getApplicationName()}/${getReadableVersion()})`;

// Web never sends this header (see buildHeaders in serverRequests.helpers.js), but describe the platform honestly
// anyway so nothing reading the string mistakes a web client for an iOS one.
const getDevice = () => {
  if (Platform.OS === 'android') {
    return ` (${toTitleCase(getManufacturerSync())} ${getModel()}; Android ${getSystemVersion()})`;
  }
  if (Platform.OS === 'ios') return ` (${getDeviceId()}; iOS ${getSystemVersion()})`;
  return ' (Web)';
};

export const userAgent = app + getDevice();
