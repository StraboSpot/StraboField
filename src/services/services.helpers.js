import {PermissionsAndroid} from 'react-native';

// Pure math/compass helper functions extracted from useCompass

export const cartesianToSpherical = (mValue1, mValue2, mValue3) => {
  let rho = Math.sqrt(Math.pow(mValue1, 2) + Math.pow(mValue2, 2) + Math.pow(mValue3, 2));
  let phi = 0;
  let theta = 0;

  if (rho === 0) {
    phi = 0;
    theta = 0;
  }
  else {
    phi = Math.acos(mValue3 / rho);
    if (rho * Math.sin((phi)) === 0) {
      if (mValue3 >= 0) {
        rho = mValue3;
        phi = 0;
        theta = 0;
      }
      else {
        rho = -mValue3;
        phi = Math.PI;
        theta = 0;
      }
    }
    else {
      theta = Math.atan2(mValue2, mValue1);
    }
  }

  return {rho: rho, phi: phi, theta: theta};
};

export const getHeading = (yaw) => {
  const degrees = yaw * (180 / Math.PI);
  const azimuthDegrees = Math.floor((degrees + 360) % 360);
  return azimuthDegrees;
};

// Pure helper extracted from useUploadImages
export const getImageIds = (images) => {
  const imageIds = [];
  images.forEach(image => imageIds.push(image.id));
  console.log(imageIds);
  return imageIds;
};

export const getStrikeAndDip = (ENU) => {
  let phi = ENU.phi;
  let theta = ENU.theta;
  let strikeDeg = 0;
  let dipDeg = 0;
  if (phi <= Math.PI / 2) {
    strikeDeg = mod((360 - theta * (180 / Math.PI)), 360);
    dipDeg = phi * (180 / Math.PI);

  }
  else {
    strikeDeg = mod((360 - (theta + Math.PI) * (180 / Math.PI)), 360);
    dipDeg = (Math.PI - phi) * (180 / Math.PI);
  }

  return {strike: strikeDeg, dip: dipDeg};
};

export const getTrendAndPlunge = (ENU_TP) => {
  let phi = ENU_TP.phi;
  let theta = ENU_TP.theta;
  let trendDeg = mod(90 - theta * (180 / Math.PI), 360);
  let plungeDeg = phi * (180 / Math.PI) - 90;
  if (plungeDeg < 0) {
    trendDeg = mod(trendDeg + 180, 360);
    plungeDeg = -plungeDeg;
  }
  return {trend: trendDeg, plunge: plungeDeg};
};

export const mod = (value, degree) => {
  return ((value % degree) + degree) % degree;
};

// Pure helper extracted from usePermissions
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
