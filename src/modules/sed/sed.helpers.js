import {IMAGE_OVERLAY_SIZE_KEYS, LITHOLOGY_INTERVAL_CHARACTERS} from './sed.constants';
import {isEmpty} from '../../shared/helpers';
import {isStratInterval} from '../spots/spots.helpers';

export const getBasicLithologyIndex = (lithology) => {
  if (lithology.primary_lithology === 'organic_coal') return 1;
  else if (lithology.mud_silt_grain_size) return 2;
  else if (lithology.sand_grain_size) return 3;
  else if (lithology.congl_grain_size || lithology.breccia_grain_size) return 4;
  else if (lithology.dunham_classification) return 5;
  return 0;
};

// The overlay fields are typed as text, so read the numbers out of them for saving. Everything but the image id is
// a number: a width or height is kept only as a pair of positive numbers, and anything that is not a number at all
// is left out rather than stored as one. A 0 is a number like any other - it is what an origin on the axis is -
// and a negative origin is what puts the image left of or below that axis, so neither is treated as nothing.
export const getCleanedImageOverlay = (values) => {
  const hasImageSize = parseFloat(values.image_height) > 0 && parseFloat(values.image_width) > 0;
  return Object.entries(values).reduce((acc, [key, value]) => {
    const number = parseFloat(value);
    if (key === 'id') return {...acc, id: value};
    if (IMAGE_OVERLAY_SIZE_KEYS.includes(key)) return hasImageSize ? {...acc, [key]: number} : acc;
    return isNaN(number) ? acc : {...acc, [key]: number};
  }, {});
};

// The fields a lithology has to answer when the Spot it belongs to is an interval mapped on a strat section. Their
// surveys mark them optional because a lithology on an ordinary Spot does not need them - it is the interval that
// makes them required, and a survey rule cannot see the Spot it is being filled in for. The same rules are reported
// at save time by validateLithologiesPage, together with the ones no single field can carry, so keep the two in step.
export const getRequiredLithologyKeys = (lithology, spot) => {
  if (!isStratInterval(spot) || !LITHOLOGY_INTERVAL_CHARACTERS.includes(spot.properties?.sed?.character)) return [];
  const requiredKeys = ['primary_lithology'];
  // Which grain size a siliciclastic needs is not known until its type is chosen, so ask for the type first
  if (lithology.primary_lithology === 'siliciclastic') {
    requiredKeys.push('siliciclastic_type', getSiliciclasticGrainSizeKey(lithology.siliciclastic_type));
  }
  else if (lithology.primary_lithology === 'limestone' || lithology.primary_lithology === 'dolostone') {
    requiredKeys.push('dunham_classification');
  }
  return requiredKeys.filter(Boolean);
};

export const getSiliciclasticGrainSize = lithology => lithology[getSiliciclasticGrainSizeKey(
  lithology.siliciclastic_type)];

// The grain size a siliciclastic lithology is measured by is a different field for each type of siliciclastic
export const getSiliciclasticGrainSizeKey = (siliciclasticType) => {
  switch (siliciclasticType) {
    case 'sandstone':
      return 'sand_grain_size';
    case 'conglomerate':
      return 'congl_grain_size';
    case 'breccia':
      return 'breccia_grain_size';
    case 'claystone':
    case 'mudstone':
    case 'shale':
    case 'siltstone':
      return 'mud_silt_grain_size';
    default:
      return undefined;
  }
};

export const setSedFieldValue = (formCurrent, name, value) => {
  if (name === 'siliciclastic_type' && (value === 'claystone' || value === 'mudstone')) {
    formCurrent.setFieldValue('mud_silt_grain_size', 'clay');
  }
  else if (name === 'siliciclastic_type' && value === 'siltstone') {
    formCurrent.setFieldValue('mud_silt_grain_size', 'silt');
  }
  formCurrent.setFieldValue(name, value);
};

// Leaves the values it is given alone; getCleanedImageOverlay makes what is saved out of them
export const validateImageOverlay = (values) => {
  const errors = {};
  if (isEmpty(values.id)) errors.id = 'Required';
  const opacity = parseFloat(values.image_opacity);
  if (opacity < 0 || opacity > 1) errors.image_opacity = 'Must be between 0 and 1.';
  // An origin may be negative - it places the image on either side of the axes origin - but a size may not. The
  // two sizes are also saved as a pair, so one without the other would be dropped without anything saying so.
  IMAGE_OVERLAY_SIZE_KEYS.forEach((key, i) => {
    const otherKey = IMAGE_OVERLAY_SIZE_KEYS[1 - i];
    const number = parseFloat(values[key]);
    if (isEmpty(values[key])) {
      if (!isEmpty(values[otherKey])) {
        errors[key] = 'Needed with the ' + otherKey.replace('image_', '') + '. Use Original Size to clear both.';
      }
    }
    else if (isNaN(number)) errors[key] = 'Must be a number.';
    else if (number <= 0) errors[key] = 'Must be greater than 0.';
  });
  return errors;
};
