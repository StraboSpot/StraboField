const GEOGRAPHY_FORM_NAME = ['general', 'geography'];

// The fields that show and edit the Spot's geometry, which are not saved among its properties
const GEOMETRY_FIELDS = ['coordsString', 'easting', 'geomType', 'latitude', 'longitude', 'northing', 'utm_zone',
  'x_pixels', 'y_pixels'];

// The geometry fields' labels, which the survey's label dictionary can't name them by since they aren't in the survey
const GEOMETRY_FIELD_LABELS = {
  easting: 'Easting (m)',
  latitude: 'Latitude',
  longitude: 'Longitude',
  northing: 'Northing (m)',
  utm_zone: 'UTM Zone',
  x_pixels: 'X Pixels',
  y_pixels: 'Y Pixels',
};

export {GEOGRAPHY_FORM_NAME, GEOMETRY_FIELD_LABELS, GEOMETRY_FIELDS};
