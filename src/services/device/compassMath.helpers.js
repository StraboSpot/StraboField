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
