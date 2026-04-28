import {PermissionsAndroid} from 'react-native';

export const permissionsRequestType = (permission) => {
  switch (permission) {
    case PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE:
      return {
        title: 'WRITE To External Storage',
        message: 'StraboSpot needs permission access the external storage to save files',
      };
    case PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE:
      return {
        title: 'READ External Storage',
        message: 'StraboSpot needs permission access the external storage to read files',
      };
    case PermissionsAndroid.PERMISSIONS.CAMERA:
      return {
        title: 'CAMERA',
        message: 'StraboSpot needs permission to use the camera take pictures',
      };
    case PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION:
      return {
        title: 'Location Permission',
        message: 'App needs access to your location',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      };
  }
};
