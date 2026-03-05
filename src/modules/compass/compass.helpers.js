import {roundToDecimalPlaces, toDegrees, toRadians} from '../../shared/Helpers';

export const calcDipDir = (strike, formRefCurrent) => {
  console.log('Calculating dip direction...');
  let dipDirection = (strike + 90) % 360;
  formRefCurrent.setFieldValue('dip_direction', roundToDecimalPlaces(dipDirection, 0));
};

export const calcStrike = (dipDirection, formRefCurrent) => {
  console.log('Calculating strike...');
  let strike = dipDirection - 90;
  if (strike < 0) strike = 360 + strike;
  formRefCurrent.setFieldValue('strike', roundToDecimalPlaces(strike, 0));
};

export const calcTrendPlunge = (rake, formRefCurrent, selectedAttitude) => {
  console.log('Calculating trend and plunge...');
  const strike = selectedAttitude.strike;
  const dip = selectedAttitude.dip;
  let trend;
  const beta = toDegrees(Math.atan(Math.tan(toRadians(rake)) * Math.cos(toRadians(dip))));
  if (rake <= 90) trend = strike + beta;
  else {
    trend = 180 + strike + beta;
    if (trend >= 360) trend = trend - 360;
  }
  const plunge = toDegrees(Math.asin(Math.sin(toRadians(dip)) * Math.sin(toRadians(rake))));
  formRefCurrent.setFieldValue('trend', roundToDecimalPlaces(trend, 0));
  formRefCurrent.setFieldValue('plunge', roundToDecimalPlaces(plunge, 0));
};

export const formatDeg = val => `${roundToDecimalPlaces(val ?? 0, 1)}°`;
