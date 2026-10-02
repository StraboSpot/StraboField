import {
  getCleanedImageOverlay,
  getRequiredLithologyKeys,
  getSedRockTitle,
  getSiliciclasticGrainSize,
  getSiliciclasticGrainSizeKey,
  hasOtherLithologyTabData,
  hasSedRockData,
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

describe('getSedRockTitle', () => {
  const getLabel = key => 'L(' + key + ')';
  const getLabels = keys => (Array.isArray(keys) ? keys : [keys]).map(getLabel).join(', ');

  it('names a lithology with no primary lithology as an unknown rock type', () => {
    expect(getSedRockTitle({id: 1, grain_size: 'fine'}, getLabel, getLabels)).toBe('Unknown Rock Type');
  });

  it('names a lithology by its primary lithology and second order type', () => {
    expect(getSedRockTitle({primary_lithology: 'siliciclastic', siliciclastic_type: 'sandstone'}, getLabel,
      getLabels)).toBe('L(siliciclastic) - L(SANDSTONE)');
  });

  it('adds the first Composition field filled in, in parentheses after the type', () => {
    expect(getSedRockTitle({primary_lithology: 'siliciclastic', siliciclastic_type: 'sandstone',
      minerals_present: ['quartz', 'feldspar'], sandstone_modifier: ['arkosic']}, getLabel, getLabels))
      .toBe('L(siliciclastic) - L(SANDSTONE) (L(quartz), L(feldspar))');
  });

  it('gives a lithology with no primary lithology its composition too', () => {
    expect(getSedRockTitle({clast_composition: ['limestone']}, getLabel, getLabels))
      .toBe('Unknown Rock Type (L(limestone))');
  });

  it('adds no composition when the first is a second order type the title already shows', () => {
    expect(getSedRockTitle({primary_lithology: 'evaporite', evaporite_type: ['gypsum'], halite_primary_type: ['a']},
      getLabel, getLabels)).toBe('L(evaporite) - L(GYPSUM)');
  });

  it('adds a Composition field that comes before a second order type', () => {
    expect(getSedRockTitle({primary_lithology: 'evaporite', evaporite_type: ['gypsum'], minerals_present: ['halite']},
      getLabel, getLabels)).toBe('L(evaporite) - L(GYPSUM) (L(halite))');
  });

  it('adds the composition after a Dunham classification too', () => {
    expect(getSedRockTitle({primary_lithology: 'limestone', dunham_classification: 'packstone',
      non_skeletal_carbonate_compone: ['ooid']}, getLabel, getLabels)).toBe('L(limestone) - L(PACKSTONE) (L(ooid))');
  });

  it('shows what was typed for an other composition in place of Other', () => {
    expect(getSedRockTitle({primary_lithology: 'siliciclastic', minerals_present: ['quartz', 'other'],
      other_minerals: 'zircon'}, getLabel, getLabels)).toBe('L(siliciclastic) (L(quartz), Zircon)');
  });

  it('shows what was typed for an other second order type in place of Other', () => {
    expect(getSedRockTitle({primary_lithology: 'evaporite', evaporite_type: ['other'],
      other_evaporite_type: 'trona'}, getLabel, getLabels)).toBe('L(evaporite) - TRONA');
  });

  it('keeps Other when nothing was typed for it', () => {
    expect(getSedRockTitle({primary_lithology: 'siliciclastic', minerals_present: ['other']}, getLabel, getLabels))
      .toBe('L(siliciclastic) (L(other))');
  });

  it('capitalizes both words of a rock type joined by a slash', () => {
    expect(getSedRockTitle({primary_lithology: 'organic_coal'}, () => 'organic/coal', getLabels)).toBe('Organic/Coal');
  });

  it('leaves the Composition notes out', () => {
    expect(getSedRockTitle({primary_lithology: 'chert', notes: 'looks odd'}, getLabel, getLabels))
      .toBe('L(chert)');
  });
});

describe('hasOtherLithologyTabData', () => {
  it('counts a field from the Composition, Texture or Stratification tab', () => {
    expect(hasOtherLithologyTabData({id: 1, minerals_present: ['quartz']})).toBe(true);
    expect(hasOtherLithologyTabData({id: 1, sorting: 'well'})).toBe(true);
    expect(hasOtherLithologyTabData({id: 1, stratification: ['strat_bedding']})).toBe(true);
  });

  it('does not count a field the Sedimentary Rocks form already shows', () => {
    expect(hasOtherLithologyTabData({id: 1, primary_lithology: 'chert', notes: 'n', volcaniclastic_type: ['tuff']}))
      .toBe(false);
  });
});

describe('hasSedRockData', () => {
  it('counts a field of the Sedimentary Rocks form', () => {
    expect(hasSedRockData({id: 1, primary_lithology: 'chert'})).toBe(true);
    expect(hasSedRockData({id: 1, fresh_color: 'gray'})).toBe(true);
  });

  it('does not count data from the other lithology tabs, or the label', () => {
    expect(hasSedRockData({id: 1, label: 'Unknown Rock Type', minerals_present: ['quartz'], sorting: 'well'}))
      .toBe(false);
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
    expect(validateImageOverlay({image_opacity: '1.5'}).image_opacity).toBe('Must be between 0 and 1.');
  });

  it('finds no errors for an opacity within 0 to 1', () => {
    expect(validateImageOverlay({id: 'image1', image_opacity: '0.5'})).toEqual({});
  });

  it('asks for the image the overlay draws', () => {
    expect(validateImageOverlay({}).id).toBe('Required');
  });

  it('accepts a negative origin, which places the image left of or below the axes origin', () => {
    expect(validateImageOverlay({id: 'image1', image_origin_x: '-100', image_origin_y: '-50'})).toEqual({});
  });

  it('rejects a width or height that is not greater than 0', () => {
    expect(validateImageOverlay({id: 'image1', image_width: '-200', image_height: '100'}).image_width)
      .toBe('Must be greater than 0.');
    expect(validateImageOverlay({id: 'image1', image_width: '200', image_height: '0'}).image_height)
      .toBe('Must be greater than 0.');
  });

  it('rejects a half-typed size rather than letting the pair be dropped without saying so', () => {
    expect(validateImageOverlay({id: 'image1', image_width: '-', image_height: '100'}).image_width)
      .toBe('Must be a number.');
  });

  it('asks for the other size when only one of the pair is filled in, since neither saves alone', () => {
    expect(validateImageOverlay({id: 'image1', image_width: '', image_height: '300'}).image_width)
      .toBe('Needed with the height. Use Original Size to clear both.');
    expect(validateImageOverlay({id: 'image1', image_width: '300', image_height: ''}).image_height)
      .toBe('Needed with the width. Use Original Size to clear both.');
    expect(validateImageOverlay({id: 'image1', image_width: '', image_height: ''})).toEqual({});
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

  it('keeps a negative origin, which is what moves the image left of or below the axes origin', () => {
    expect(getCleanedImageOverlay({id: 'image1', image_origin_x: '-100', image_origin_y: '-50'}))
      .toEqual({id: 'image1', image_origin_x: -100, image_origin_y: -50});
  });

  it('keeps an origin of 0 rather than reading it as nothing', () => {
    expect(getCleanedImageOverlay({id: 'image1', image_origin_x: '0'}).image_origin_x).toBe(0);
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
