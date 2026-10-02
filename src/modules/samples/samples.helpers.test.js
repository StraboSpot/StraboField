import {
  getLinkedSample,
  getSampleDifferences,
  getSampleMetadata,
  getSamplesLinkedTo,
  getStraboSampleFromResponse,
  getSampleTitle,
  getUnlinkedSample,
  isLinkedToFieldSpot,
  isLinkedToOtherFieldSpot,
  isSampleStub,
} from './samples.helpers';

const sample = {id: 's1', sample_id_name: 'JG-1'};
const richSample = {
  properties: {id: 1756000000001, isSample: true, name: 'JG-2', samples: [{id: 's2', sample_id_name: 'JG-2'}]},
};

describe('getSampleMetadata', () => {
  it('gives back a sample kept on its parent Spot as it is', () => {
    expect(getSampleMetadata(sample)).toBe(sample);
  });

  it('reaches into a rich sample for the record the Spot holds', () => {
    expect(getSampleMetadata(richSample).sample_id_name).toBe('JG-2');
  });

  it('falls back to the Spot id for a rich sample whose record has gone', () => {
    const emptyRichSample = {properties: {id: 1756000000002, isSample: true}};
    expect(getSampleMetadata(emptyRichSample)).toEqual({id: 1756000000002});
  });
});

// A label is filled in with sample_id_name on save, so the two read the same until someone types over it
describe('getSampleTitle', () => {
  it('names a sample by the name it was given when it has no label of its own', () => {
    expect(getSampleTitle(sample)).toBe('JG-1');
    expect(getSampleTitle(richSample)).toBe('JG-2');
  });

  it('prefers a label typed over that name', () => {
    expect(getSampleTitle({...sample, label: 'Big pluton, north face'})).toBe('Big pluton, north face');
  });

  it('falls back to the Spot name, then to Unknown', () => {
    expect(getSampleTitle({properties: {id: 1, isSample: true, name: 'JG-3'}})).toBe('JG-3');
    expect(getSampleTitle({})).toBe('Unknown');
  });
});

describe('getSampleDifferences', () => {
  // As the server sent it: nothing to say about the IGSN, notes or location
  const strabosample = {
    id: '56470cab-9b17-4aa0-be82-59012c85e6af',
    userpkey: 905,
    name: 'Test 2',
    igsn: null,
    description: null,
    notes: null,
    latitude: null,
    longitude: null,
    display_sample_type: 'intact_rock',
    display_sample_purpose: 'fabric___micro',
  };

  it('lists only the fields StraboSamples fills in differently', () => {
    const fieldSample = {id: 1, sample_id_name: 'T-2', sample_notes: 'Kept', material_type: 'intact_rock'};
    expect(getSampleDifferences(fieldSample, strabosample)).toEqual([
      {key: 'sample_id_name', fieldValue: 'T-2', strabosamplesValue: 'Test 2'},
      {key: 'label', fieldValue: undefined, strabosamplesValue: 'Test 2'},
      {key: 'main_sampling_purpose', fieldValue: undefined, strabosamplesValue: 'fabric___micro'},
    ]);
  });

  it('prefers the Field record the sample was linked with before, but not its id', () => {
    const differences = getSampleDifferences({id: 1}, {
      ...strabosample,
      field_data: {id: 999, strabosamples_id: 'other', sample_id_name: 'Old field name', color: 'black'},
    });
    expect(differences.map(d => [d.key, d.strabosamplesValue])).toEqual([
      ['sample_id_name', 'Old field name'],
      ['label', 'Test 2'],
      ['material_type', 'intact_rock'],
      ['main_sampling_purpose', 'fabric___micro'],
      ['color', 'black'],
    ]);
  });
});

describe('getSampleDifferences for location', () => {
  const strabosample = {id: 'a', latitude: 44.12, longitude: '-110.5'};
  const point = coordinates => ({type: 'Point', coordinates: coordinates});

  it('compares to as many decimal places as StraboSamples gives', () => {
    expect(getSampleDifferences({}, strabosample, point([-110.4987654, 44.1234567]))).toEqual([]);
    expect(getSampleDifferences({}, strabosample, point([-110.4987654, 44.1298]))).toEqual([
      {key: 'location', fieldValue: [-110.4987654, 44.1298], strabosamplesValue: [-110.5, 44.12]},
    ]);
  });

  it('compares to no more than five decimal places', () => {
    const precise = {id: 'a', latitude: 44.1234561, longitude: -110.1234561};
    expect(getSampleDifferences({}, precise, point([-110.123456, 44.123456]))).toEqual([]);
    expect(getSampleDifferences({}, precise, point([-110.12344, 44.123456]))).toHaveLength(1);
  });

  it('offers StraboSamples\' location to a sample with none, but never in place of a line', () => {
    expect(getSampleDifferences({}, strabosample)).toEqual([
      {key: 'location', fieldValue: undefined, strabosamplesValue: [-110.5, 44.12]},
    ]);
    expect(getSampleDifferences({}, strabosample, {type: 'LineString', coordinates: [[0, 0], [1, 1]]})).toEqual([]);
  });

  it('keeps the sample\'s location when StraboSamples has none', () => {
    expect(getSampleDifferences({}, {id: 'a', latitude: null, longitude: null}, point([1, 1]))).toEqual([]);
    expect(getSampleDifferences({}, {id: 'a', latitude: 44, longitude: null})).toEqual([]);
  });
});

describe('getLinkedSample', () => {
  const strabosample = {
    id: 'ab12cd34-ef56-4a78-9b01-23456789abcd',
    name: 'Basalt core BC-14',
    igsn: null,
    description: 'Cored from the flow top',
    display_sample_type: 'intact_rock',
  };
  const fieldSample = {id: 1, sample_id_name: 'BC-14 field', sample_notes: 'Kept', material_type: 'sediment'};

  it('takes the StraboSamples values picked and keeps the rest', () => {
    expect(getLinkedSample(fieldSample, strabosample, ['sample_id_name', 'sample_description'])).toEqual({
      id: 1,
      strabosamples_id: 'ab12cd34-ef56-4a78-9b01-23456789abcd',
      sample_id_name: 'Basalt core BC-14',
      sample_description: 'Cored from the flow top',
      sample_notes: 'Kept',
      material_type: 'sediment',
    });
  });

  it('compares and takes the label as well as the name', () => {
    const differences = getSampleDifferences({...fieldSample, label: 'BC-14 field'}, strabosample);
    expect(differences.find(d => d.key === 'label')).toEqual(
      {key: 'label', fieldValue: 'BC-14 field', strabosamplesValue: 'Basalt core BC-14'});
    expect(getLinkedSample({...fieldSample, label: 'BC-14 field'}, strabosample, ['label']).label)
      .toBe('Basalt core BC-14');
  });

  it('never takes an empty StraboSamples value', () => {
    expect(getLinkedSample(fieldSample, strabosample, ['Sample_IGSN', 'sample_notes']).sample_notes).toBe('Kept');
  });

  it('keeps a numeric StraboSamples id as a string', () => {
    expect(getLinkedSample({id: 1}, {id: 17794148544769}).strabosamples_id).toBe('17794148544769');
    expect(getLinkedSample({id: 1}, {id: '0017794148544769'}).strabosamples_id).toBe('0017794148544769');
  });
});

describe('isSampleStub', () => {
  it('knows the placeholder a parent Spot keeps from a sample', () => {
    expect(isSampleStub({id: 1})).toBe(true);
    expect(isSampleStub({id: 1, sample_id_name: 'A'})).toBe(false);
  });
});

describe('getUnlinkedSample', () => {
  it('drops the link and nothing else', () => {
    expect(getUnlinkedSample({id: 1, strabosamples_id: 'x', sample_id_name: 'A'})).toEqual({id: 1, sample_id_name: 'A'});
  });
});

describe('getSamplesLinkedTo', () => {
  const spots = {
    1: {properties: {id: 1, isSample: true, samples: [{id: 1, strabosamples_id: 'x'}]}},
    2: {properties: {id: 2, samples: [{id: 1}, {id: 3, strabosamples_id: 'x'}]}},
    4: {properties: {id: 4}},
  };

  it('finds the other samples linked to the same StraboSamples sample', () => {
    expect(getSamplesLinkedTo(spots, 'x', 1)).toEqual([{id: 3, strabosamples_id: 'x'}]);
    expect(getSamplesLinkedTo(spots, 'y', 1)).toEqual([]);
  });
});

describe('getStraboSampleFromResponse', () => {
  const links = [{subsystem: 'field', reference_id: '17'}];

  it('reads a sample sent on its own', () => {
    expect(getStraboSampleFromResponse({id: 'a', subsystem_links: links})).toEqual({id: 'a', subsystem_links: links});
  });

  it('keeps what sits beside a wrapped sample', () => {
    expect(getStraboSampleFromResponse({sample: {id: 'a', name: 'A'}, subsystem_links: links}))
      .toEqual({id: 'a', name: 'A', sample: {id: 'a', name: 'A'}, subsystem_links: links});
  });

  it('keeps what sits inside a wrapped sample', () => {
    expect(getStraboSampleFromResponse({sample: {id: 'a', subsystem_links: links}}).subsystem_links).toBe(links);
  });

  it('keeps data beside a wrapped sample that the sample leaves empty', () => {
    const microData = {thin_sections: [{id: 1}]};
    expect(getStraboSampleFromResponse({sample: {id: 'a', micro_data: null}, micro_data: microData}).micro_data)
      .toBe(microData);
  });
});

describe('isLinkedToFieldSpot', () => {
  it('finds the link the server made once the sample was uploaded', () => {
    const strabosample = {subsystem_links: [{subsystem: 'micro', reference_id: '17'}, {subsystem: 'field', reference_id: '17'}]};
    expect(isLinkedToFieldSpot(strabosample, 17)).toBe(true);
    expect(isLinkedToFieldSpot(strabosample, 18)).toBe(false);
    expect(isLinkedToFieldSpot({subsystem_links: [{subsystem: 'micro', reference_id: '17'}]}, 17)).toBe(false);
    expect(isLinkedToFieldSpot({}, 17)).toBe(false);
  });

  // As the server sent it for a sample kept on its parent Spot: the reference is the parent, not the sample
  it('knows a sample kept on a parent Spot by the parent', () => {
    const strabosample = {
      subsystem_links: [{subsystem: 'field', reference_id: '17570006372284', reference_metadata: {rich: false}}],
    };
    expect(isLinkedToFieldSpot(strabosample, 17570006372284)).toBe(true);
    expect(isLinkedToFieldSpot(strabosample, 17715350147590)).toBe(false);
  });
});

describe('isLinkedToOtherFieldSpot', () => {
  it('reads the Field link off the server record', () => {
    const strabosample = {subsystem_links: [{subsystem: 'micro', reference_id: '5'}, {subsystem: 'field', reference_id: '17'}]};
    expect(isLinkedToOtherFieldSpot(strabosample, 17)).toBe(false);
    expect(isLinkedToOtherFieldSpot(strabosample, 18)).toBe(true);
    expect(isLinkedToOtherFieldSpot({}, 18)).toBe(false);
  });

  it('knows a sample moving to its own Spot by either Spot', () => {
    const strabosample = {subsystem_links: [{subsystem: 'field', reference_id: '17570006372284'}]};
    expect(isLinkedToOtherFieldSpot(strabosample, [17570006372284, 17715350147590])).toBe(false);
    expect(isLinkedToOtherFieldSpot(strabosample, [17715350147590])).toBe(true);
  });
});
