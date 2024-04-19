import geomagnetism from 'geomagnetism';

import useMapLocationHook from '../modules/maps/useMapLocation';
import {useSelector} from 'react-redux';
import useMapCoordsHook from '../modules/maps/useMapCoords';

const useCompass = () => {

  const useMapLocation = useMapLocationHook();
  const useMapCoords = useMapCoordsHook();
  const selectedSpotCoords = useSelector(state => state.spot.selectedSpot.geometry.coordinates);

  const cartesianToSpherical = async (mValue1, mValue2, mValue3) => {
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

  const getHeading = (yaw) => {
    const degrees = yaw * (180 / Math.PI);
    const azimuthDegrees = Math.floor((degrees + 360) % 360);
    return azimuthDegrees;
  };

  const getUserDeclination = async () => {
    const [longitude, latitude] = await useMapCoords.getCenterCoordsOfFeature();
    const magneticDeclination = geomagnetism.model().point([latitude, longitude]);
    console.log('MagDeclination', magneticDeclination);
    return magneticDeclination.decl;
  };

  const strikeAndDip = async (ENU) => {
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
      dipDeg = (Math.PI + phi) * (180 / Math.PI);
    }
    // console.log('Strike:', strikeDeg, 'Dip:', dipDeg);

    return {strike: strikeDeg, dip: dipDeg};
  };

  const trendAndPlunge = async (ENU_TP) => {
    let phi = ENU_TP.phi;
    let theta = ENU_TP.theta;
    let trendDeg = mod(90 - theta * (180 / Math.PI), 360);
    let plungeDeg = phi * (180 / Math.PI) - 90;
    if (plungeDeg < 0) {
      trendDeg = mod(trendDeg + 180, 360);
      plungeDeg = -plungeDeg;
    }
    // console.log('Trend:', trendDeg, 'Plunge:', plungeDeg);
    return {trend: trendDeg, plunge: plungeDeg};
  };

  const mod = (value, degree) => {
    return ((value % degree) + degree) % degree;
  };


  return {
    cartesianToSpherical: cartesianToSpherical,
    getHeading: getHeading,
    getUserDeclination: getUserDeclination,
    strikeAndDip: strikeAndDip,
    trendAndPlunge: trendAndPlunge,
  };
};

export default useCompass;
