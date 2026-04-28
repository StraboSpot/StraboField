import {PermissionsAndroid} from 'react-native';

import DeviceInfo from 'react-native-device-info';

import {permissionsRequestType} from './device.helpers';
import {isEmpty} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';

const usePermissions = () => {
  /* Exported Functions */

  const checkPermission = async (permission) => {
    let granted;
    let deviceVersion = DeviceInfo.getSystemVersion();

    if ((permission === PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE || permission === PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE) && deviceVersion >= 13) {
      return PermissionsAndroid.RESULTS.GRANTED;
    }

    granted = await PermissionsAndroid.check(permission);
    if (granted) return PermissionsAndroid.RESULTS.GRANTED;
    else granted = await requestPermission(permission);
    console.log('Permissions', granted);
    return granted;
  };

  const hasLocationPermission = async () => {
    const granted = await requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const requestPermission = async (permission) => {
    const useRational = {
      ...permissionsRequestType(permission),
      buttonPositive: 'OK',
    };
    const result = await PermissionsAndroid.request(permission, useRational);
    console.log('RESULT', result);
    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return PermissionsAndroid.RESULTS.GRANTED;
    }
    else alert('Permission Denied', 'You may have denied this permission previously. \nTo allow permission please go to Settings -> App -> StraboSpot2 -> Permissions');
  };

  const requestPermissions = async (permissions) => {
    if (Array.isArray(permissions) && !isEmpty(permissions)) {
      return await PermissionsAndroid.requestMultiple(permissions);
    }
    else throw Error('permissions is not of type array');
  };

  return {
    checkPermission,
    hasLocationPermission,
    requestPermission,
    requestPermissions,
  };
};

export default usePermissions;
