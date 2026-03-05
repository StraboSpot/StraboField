const VALID_TYPES_FOR_BOOLEAN_WITHIN = {
  'Point': ['MultiPoint', 'LineString', 'Polygon'],
  'MultiPoint': ['MultiPoint', 'LineString', 'Polygon', 'MultiPolygon'],
  'LineString': ['LineString', 'Polygon', 'MultiPolygon'],
  'Polygon': ['Polygon', 'MultiPolygon'],
};

export {VALID_TYPES_FOR_BOOLEAN_WITHIN};
