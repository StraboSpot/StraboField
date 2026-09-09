import {isEmpty} from '../../shared/helpers';
import {DEFAULT_ORIENTATION_FIELDS} from '../compass/compass.helpers';
import {EARTHQUAKE_ORIENTATION_FIELDS} from '../geomorph/geomorph.constants';
import {THREE_D_STRUCTURE_ORIENTATION_FIELDS} from '../three-d-structures/threeDStructures.constants';

// Fills in whichever half of a strike and dip direction pair is missing, the two being 90 degrees apart, and
// reports whether it filled in anything. A record holding neither field, such as a line with only a trend and
// plunge, is left alone.
export const calculateMissingOrientations = (orientation, orientationFields) => {
  let isOrientationEdited = false;
  orientationFields.forEach(({dip_direction: dipDirectionKey, strike: strikeKey}) => {
    const dipDirection = orientation[dipDirectionKey];
    const strike = orientation[strikeKey];
    if (!isEmpty(strike) && isEmpty(dipDirection)) {
      orientation[dipDirectionKey] = (strike + 90) % 360;
      isOrientationEdited = true;
    }
    else if (!isEmpty(dipDirection) && isEmpty(strike)) {
      // Wrapped through 360 so a dip direction under 90 gives a strike in range rather than a negative
      orientation[strikeKey] = (dipDirection - 90 + 360) % 360;
      isOrientationEdited = true;
    }
  });
  return isOrientationEdited;
};

export const getImageBasemapsInSpot = (spot) => {
  return spot.properties.images && spot.properties.images.reduce((acc, image) => {
    return image.annotated ? [...acc, image] : acc;
  }, []) || [];
};

export const getSpotGeometryIconSource = (spot) => {
  if (spot?.geometry?.type === 'Point') {
    if (spot.properties?.image_basemap) return require('../../assets/icons/ImagePoint_pressed.png');
    else if (spot.properties?.strat_section_id) return require('../../assets/icons/StratPoint_pressed.png');
    else return require('../../assets/icons/Point_pressed.png');
  }
  else if (spot?.geometry?.type === 'LineString') {
    if (spot.properties?.image_basemap) return require('../../assets/icons/ImageLine_pressed.png');
    else if (spot.properties?.strat_section_id) return require('../../assets/icons/StratLine_pressed.png');
    else return require('../../assets/icons/Line_pressed.png');
  }
  else if (spot?.geometry?.type === 'Polygon' || spot?.geometry?.type === 'GeometryCollection') {
    if (spot.properties?.image_basemap) return require('../../assets/icons/ImagePolygon_pressed.png');
    else if (spot.properties?.strat_section_id) return require('../../assets/icons/StratPolygon_pressed.png');
    else return require('../../assets/icons/Polygon_pressed.png');
  }
  else return require('../../assets/icons/QuestionMark_pressed.png');
};

// Every record on a Spot that can hold a plane, each paired with what its own form calls the plane's two fields.
// A measurement carries its associated planes and lines with it, and a 3D structure names a pair per group.
export const getSpotOrientations = (spot) => {
  const {
    _3d_structures: threeDStructures = [],
    earthquakes = [],
    orientation_data: measurements = [],
  } = spot.properties;
  return [
    ...measurements.flatMap(m => [m, ...(m.associated_orientation || [])])
      .map(orientation => ({fields: DEFAULT_ORIENTATION_FIELDS, orientation})),
    ...earthquakes.map(orientation => ({fields: EARTHQUAKE_ORIENTATION_FIELDS, orientation})),
    ...threeDStructures.map(orientation => ({fields: THREE_D_STRUCTURE_ORIENTATION_FIELDS, orientation})),
  ];
};

// If feature is mapped on geographical map, not an image basemap or strat section
export const isOnGeoMap = (feature) => {
  if (isEmpty(feature)) return false;
  return !feature.properties.image_basemap && !feature.properties.strat_section_id;
};

export const isOnImageBasemap = feature => feature.properties?.image_basemap;

export const isOnSameImageBasemap = (spot1, spot2) => {
  return isOnImageBasemap(spot1) && isOnImageBasemap(spot2)
    && spot1.properties.image_basemap === spot2.properties.image_basemap;
};

export const isOnSameStratSection = (spot1, spot2) => {
  return isOnStratSection(spot1) && isOnStratSection(spot2)
    && spot1.properties.strat_section_id === spot2.properties.strat_section_id;
};

export const isOnStratSection = feature => feature.properties?.strat_section_id;

export const isStratInterval = (spot) => {
  return spot?.properties?.strat_section_id && spot?.properties?.surface_feature?.surface_feature_type === 'strat_interval';
};

export const sortSpotsAlphabetically = (spotsToSort) => {
  spotsToSort.sort(
    ((a, b) => (a.properties?.name?.toLowerCase() || '').localeCompare(b.properties?.name?.toLowerCase() || '')));
  return spotsToSort;
};

export const sortSpotsByDateCreated = (spotsToSort) => {
  spotsToSort.sort(((a, b) => new Date(b.properties.date) - new Date(a.properties.date)));
  return spotsToSort;
};

export const sortSpotsByDateLastModified = (spotsToSort) => {
  spotsToSort.sort(((a, b) => new Date(b.properties.modified_timestamp) - new Date(a.properties.modified_timestamp)));
  return spotsToSort;
};
