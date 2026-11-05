import * as turf from '@turf/turf';

import {GEOMETRY_FIELDS} from './geography.constants';
import {isEmpty} from '../../shared/helpers';
import {UTM_MAX_LATITUDE, UTM_MIN_LATITUDE} from '../maps/maps.constants';
import {convertLatLngToUtm, convertUtmToLatLng, parseUtmZone} from '../maps/maps.helpers';

// The Spot's coordinates as a string, without the extra brackets at the start and end
const getCoordArray = (spot) => {
  if (!spot.geometry.coordinates) return '[multiple geometries]';
  return '[' + JSON.stringify(spot.geometry.coordinates).replace(/^\[+|\]+$/g, '') + ']';
};

// The geometry fields are typed as text, so read the numbers out of them here rather than having validation write
// them back into the form as it is typed in. turf needs numbers to build a point from them.
export const getParsedGeomValues = (values) => {
  return ['easting', 'latitude', 'longitude', 'northing', 'x_pixels', 'y_pixels'].reduce(
    (acc, key) => (isEmpty(values[key]) ? acc : {...acc, [key]: parseFloat(values[key])}), {...values});
};

// Geometry from the UTM inputs, or undefined if they are incomplete or unchanged. Re-deriving the point when the user
// did not touch the inputs would nudge the stored WGS84 coordinate by a fraction of a meter on every save.
export const getEditedUtmGeometry = ({easting, northing, utm_zone: zone}, spot) => {
  const parsedZone = parseUtmZone(zone);
  if (isEmpty(easting) || isEmpty(northing) || !parsedZone) return undefined;
  // Compare against the canonical zone label so '13 n' is not mistaken for an edit of '13N'
  const canonicalZone = `${parsedZone.zoneNumber}${parsedZone.isNorthernHemisphere ? 'N' : 'S'}`;
  if (turf.getType(spot) === 'Point') {
    const currentUtm = convertLatLngToUtm(turf.getCoord(spot));
    if (currentUtm.easting === Number(easting) && currentUtm.northing === Number(northing)
      && currentUtm.zone === canonicalZone) return undefined;
  }
  return turf.point(convertUtmToLatLng(easting, northing, zone)).geometry;
};

// The fields are left as they were typed - getParsedGeomValues reads the numbers out of them for the save - so that
// validating a change does not rewrite the field being typed in. Worded like the survey's own messages, which leave
// naming the field to its label.
export const getGeometryErrors = (values, isUtmDisplay) => {
  const {easting, latitude, longitude, northing} = getParsedGeomValues(values);
  let errors = {};
  // A hardware keyboard can type anything into these fields. Check the whole text: parseFloat reads '75W' as 75
  // and 'abc' as NaN, which passes every range check below and saves a Spot with no usable location.
  ['easting', 'latitude', 'longitude', 'northing', 'x_pixels', 'y_pixels'].forEach((key) => {
    if (isEmpty(values[key])) return;
    const text = String(values[key]).trim();
    if (text === '' || !Number.isFinite(Number(text))) errors[key] = 'Value must be a number.';
  });
  if (values.latitude && (latitude < -90 || latitude > 90)) errors.latitude = 'Value must be between -90 and 90.';
  if (values.longitude && (longitude < -180 || longitude > 180)) {
    errors.longitude = 'Value must be between -180 and 180.';
  }
  if (isUtmDisplay) {
    if (!isEmpty(values.utm_zone) && !parseUtmZone(values.utm_zone)) {
      errors.utm_zone = 'Value must be 1-60 followed by N or S, e.g. 13N.';
    }
    if (values.easting && (easting < 100000 || easting > 999999)) {
      errors.easting = 'Value must be between 100,000 and 999,999.';
    }
    if (values.northing && (northing < 0 || northing > 10000000)) {
      errors.northing = 'Value must be between 0 and 10,000,000.';
    }
    // An easting/northing inside the numeric bounds above can still convert to a latitude beyond the range UTM is
    // defined for, which would drop the Spot near a pole. Check the converted point rather than the inputs.
    if (isEmpty(errors) && !isEmpty(values.utm_zone) && values.easting && values.northing) {
      const utmLatLng = convertUtmToLatLng(easting, northing, values.utm_zone);
      if (utmLatLng && (utmLatLng[1] < UTM_MIN_LATITUDE || utmLatLng[1] > UTM_MAX_LATITUDE)) {
        errors.northing = `Coordinate is outside the UTM limits of ${Math.abs(UTM_MIN_LATITUDE)}°S `
          + `to ${UTM_MAX_LATITUDE}°N.`;
      }
    }
  }
  return errors;
};

// The form's values that are saved as the Spot's properties, which is all but the geometry fields
export const getGeographyProperties = values => Object.fromEntries(
  Object.entries(values).filter(([key]) => !GEOMETRY_FIELDS.includes(key)));

// The geometry fields' starting values: lng/lat on the geo map, or pixels plus any real-world lng/lat on an image
// basemap or strat section, and UTM too when that is what is shown
export const getInitialGeomValues = (spot, isOnGeoMap, isUtmDisplay) => {
  const initialGeomValues = {
    geomType: turf.getType(spot) || '',
    coordsString: getCoordArray(spot),
  };

  if (isOnGeoMap) {
    if (turf.getType(spot) === 'Point') {
      initialGeomValues.longitude = turf.getCoord(spot)[0];
      initialGeomValues.latitude = turf.getCoord(spot)[1];
    }
  }
  else {
    if (turf.getType(spot) === 'Point') {
      initialGeomValues.x_pixels = turf.getCoord(spot)[0];
      initialGeomValues.y_pixels = turf.getCoord(spot)[1];
    }
    if (!isEmpty(spot.properties.lng)) initialGeomValues.longitude = spot.properties.lng;
    if (!isEmpty(spot.properties.lat)) initialGeomValues.latitude = spot.properties.lat;
  }

  if (isUtmDisplay && !isEmpty(initialGeomValues.longitude) && !isEmpty(initialGeomValues.latitude)) {
    const {easting, northing, zone} = convertLatLngToUtm([initialGeomValues.longitude, initialGeomValues.latitude]);
    initialGeomValues.easting = easting;
    initialGeomValues.northing = northing;
    initialGeomValues.utm_zone = zone;
  }
  return initialGeomValues;
};
