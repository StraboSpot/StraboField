export const mod = (value, degree) => {
  return ((value % degree) + degree) % degree;
};

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

// Picks which in-plane device axis (as a native-matrix row {a, b, c}) is the "up-on-screen" edge for
// the current hold, so trend/plunge follows the edge the user actually points instead of a fixed
// portrait edge. screenRotation is the display's rotation from the device's natural orientation
// (0/90/180/270), reported by the native layer. The mapping matches Android's
// SensorManager.remapCoordinateSystem for a display rotation:
//   0   -> +deviceY (top edge)     90  -> -deviceX
//   180 -> -deviceY                270 -> +deviceX
// Portrait (0) returns the device Y row, i.e. the original, portrait-locked behavior unchanged.
export const pointingAxisRow = (matrix, screenRotation = 0) => {
  const {m11, m12, m13, m21, m22, m23} = matrix;
  switch (screenRotation) {
    case 90: return {a: -m11, b: -m12, c: -m13};
    case 180: return {a: -m21, b: -m22, c: -m23};
    case 270: return {a: m11, b: m12, c: m13};
    default: return {a: m21, b: m22, c: m23};
  }
};

export const getHeading = (yaw) => {
  const degrees = yaw * (180 / Math.PI);
  const azimuthDegrees = Math.floor((degrees + 360) % 360);
  return azimuthDegrees;
};

export const getStrikeAndDip = (ENU) => {
  let phi = ENU.phi;
  let theta = ENU.theta;
  let strike = 0, dip = 0;
  if (phi <= Math.PI / 2) {
    strike = mod((360 - theta * (180 / Math.PI)), 360);
    dip = phi * (180 / Math.PI);
  }
  else {
    strike = mod((360 - (theta + Math.PI) * (180 / Math.PI)), 360);
    dip = (Math.PI - phi) * (180 / Math.PI);
  }

  return {strike, dip};
};

export const getTrendAndPlunge = (ENU_TP) => {
  let phi = ENU_TP.phi;
  let theta = ENU_TP.theta;
  let trend = mod(90 - theta * (180 / Math.PI), 360);
  let plunge = phi * (180 / Math.PI) - 90;
  if (plunge < 0) {
    trend = mod(trend + 180, 360);
    plunge = -plunge;
  }
  return {trend, plunge};
};
