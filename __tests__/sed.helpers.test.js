import {
  getCleanedImageOverlay,
  getRequiredLithologyKeys,
  getSiliciclasticGrainSize,
  getSiliciclasticGrainSizeKey,
  validateImageOverlay,
} from '../src/modules/sed/sed.helpers';

const INTERVAL_SPOT = {
  properties: {
    strat_section_id: 1,
    surface_feature: {surface_feature_type: 'strat_interval'},
    sed: {character: 'bed'},
  },
};

describe('getRequiredLithologyKeys', () => {
  it('requires the siliciclastic type and the grain size that goes with it', () => {
    expect(getRequiredLithologyKeys({primary_lithology: 'siliciclastic', siliciclastic_type: 'sandstone'},
      INTERVAL_SPOT)).toEqual(['primary_lithology', 'siliciclastic_type', 'sand_grain_size']);
  });

  it('asks for the type first, since which grain size applies is not known without it', () => {
    expect(getRequiredLithologyKeys({primary_lithology: 'siliciclastic'}, INTERVAL_SPOT))
      .toEqual(['primary_lithology', 'siliciclastic_type']);
  });

  it('requires the Dunham classification for a limestone or a dolostone', () => {
    expect(getRequiredLithologyKeys({primary_lithology: 'dolostone'}, INTERVAL_SPOT))
      .toEqual(['primary_lithology', 'dunham_classification']);
  });

  it('requires nothing of a lithology on a Spot that is not a mapped interval', () => {
    const plainSpot = {properties: {sed: {character: 'bed'}}};
    expect(getRequiredLithologyKeys({primary_lithology: 'siliciclastic'}, plainSpot)).toEqual([]);
  });

  it('requires nothing when the interval has no character to require it for', () => {
    const spot = {...INTERVAL_SPOT, properties: {...INTERVAL_SPOT.properties, sed: {}}};
    expect(getRequiredLithologyKeys({primary_lithology: 'siliciclastic'}, spot)).toEqual([]);
  });
});

describe('getSiliciclasticGrainSize', () => {
  it('reads the grain size field that goes with the siliciclastic type', () => {
    expect(getSiliciclasticGrainSize({siliciclastic_type: 'sandstone', sand_grain_size: 'coarse'})).toBe('coarse');
    expect(getSiliciclasticGrainSize({siliciclastic_type: 'shale', mud_silt_grain_size: 'clay'})).toBe('clay');
  });

  it('has no grain size without a type, or for a type that has none', () => {
    expect(getSiliciclasticGrainSize({sand_grain_size: 'coarse'})).toBeUndefined();
    expect(getSiliciclasticGrainSizeKey(undefined)).toBeUndefined();
  });

  it('names the field a type must answer, which is what marks it required', () => {
    expect(getSiliciclasticGrainSizeKey('conglomerate')).toBe('congl_grain_size');
    expect(getSiliciclasticGrainSizeKey('breccia')).toBe('breccia_grain_size');
    expect(getSiliciclasticGrainSizeKey('siltstone')).toBe('mud_silt_grain_size');
  });
});

describe('validateImageOverlay', () => {
  it('reports an opacity outside 0 to 1', () => {
    expect(validateImageOverlay({image_opacity: '1.5'}).image_opacity).toBe('Opacity must be between 0 and 1.');
  });

  it('finds no errors for an opacity within 0 to 1', () => {
    expect(validateImageOverlay({image_opacity: '0.5'})).toEqual({});
  });

  it('leaves the values it is given untouched', () => {
    const values = {id: 'image1', image_opacity: '0.5', image_height: '100', image_width: '0'};
    validateImageOverlay(values);
    expect(values).toEqual({id: 'image1', image_opacity: '0.5', image_height: '100', image_width: '0'});
  });
});

describe('getCleanedImageOverlay', () => {
  it('keeps the image id as it is and converts the rest from text', () => {
    expect(getCleanedImageOverlay({id: 'image1', image_opacity: '0.5', image_height: '100', image_width: '50'}))
      .toEqual({id: 'image1', image_opacity: 0.5, image_height: 100, image_width: 50});
  });

  it('keeps an opacity of 0', () => {
    expect(getCleanedImageOverlay({id: 'image1', image_opacity: '0'}).image_opacity).toBe(0);
  });

  it('drops a height and width unless both are positive numbers', () => {
    const cleaned = getCleanedImageOverlay({id: 'image1', image_height: '100', image_width: '0'});
    expect(cleaned).toEqual({id: 'image1'});
  });

  it('leaves the values it is given untouched', () => {
    const values = {id: 'image1', image_height: '100', image_width: '0'};
    getCleanedImageOverlay(values);
    expect(values).toEqual({id: 'image1', image_height: '100', image_width: '0'});
  });
});
