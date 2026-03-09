import alert from '../../shared/ui/alert';

export const getBasicLithologyIndex = (lithology) => {
  if (lithology.primary_lithology === 'organic_coal') return 1;
  else if (lithology.mud_silt_grain_size) return 2;
  else if (lithology.sand_grain_size) return 3;
  else if (lithology.congl_grain_size || lithology.breccia_grain_size) return 4;
  else if (lithology.dunham_classification) return 5;
  return 0;
};

export const getSiliciclasticGrainSize = (lithology) => {
  switch (lithology.siliciclastic_type) {
    case 'sandstone':
      return lithology.sand_grain_size;
    case 'conglomerate':
      return lithology.congl_grain_size;
    case 'breccia':
      return lithology.breccia_grain_size;
    case 'claystone':
    case 'mudstone':
    case 'shale':
    case 'siltstone':
      return lithology.mud_silt_grain_size;
    default:
      return undefined;
  }
};

export const onSedFormChange = (formCurrent, name, value) => {
  if (name === 'siliciclastic_type' && (value === 'claystone' || value === 'mudstone')) {
    formCurrent.setFieldValue('mud_silt_grain_size', 'clay');
  }
  else if (name === 'siliciclastic_type' && value === 'siltstone') {
    formCurrent.setFieldValue('mud_silt_grain_size', 'silt');
  }
  formCurrent.setFieldValue(name, value);
};

export const showFieldInfo = (label, info) => alert(label, info);

export const validateImageOverlay = (values) => {
  let errors = {};
  // console.log('Values before image overlay validation:', values);
  if ((values.image_height && !values.image_width) || (values.image_width && !values.image_height)) {
    delete values.image_height;
    delete values.image_width;
  }
  Object.entries(values).forEach(([key, value]) => {
    switch (key) {
      case 'id':
        break;
      case 'image_height':
      case 'image_width':
        if (parseFloat(value) > 0) values[key] = parseFloat(value);
        else {
          delete values.image_height;
          delete values.image_width;
        }
        break;
      case 'image_opacity':
        if (parseFloat(value) < 0 || parseFloat(value) > 1) errors[key] = 'Opacity must be between 0 and 1.';
        else values[key] = parseFloat(value);
        break;
      default:
        if (parseFloat(value)) values[key] = parseFloat(value);
        else delete values[key];
        break;
    }
  });
  // console.log('Values after image overlay validation:', values);
  return errors;
};
