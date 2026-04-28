import {Platform} from 'react-native';

import {
  getApplicationName,
  getDeviceId,
  getManufacturerSync,
  getModel,
  getReadableVersion,
  getSystemVersion,
} from 'react-native-device-info';

import {toTitleCase} from '../../shared/Helpers';

const app = `(${getApplicationName()}/${getReadableVersion()})`;

const device = Platform.OS === 'android'
  ? ` (${toTitleCase(getManufacturerSync())} ${getModel()}; Android ${getSystemVersion()})`
  : ` (${getDeviceId()}; iOS ${getSystemVersion()})`;

export const userAgent = app + device;
