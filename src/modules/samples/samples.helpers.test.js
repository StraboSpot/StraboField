import {
  getLinkedSample,
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

describe('getLinkedSample', () => {
  const strabosample = {
    id: 'ab12cd34-ef56-4a78-9b01-23456789abcd',
    name: 'Basalt core BC-14',
    igsn: null,
    description: 'Cored from the flow top',
    notes: '',
    display_sample_type: 'intact_rock',
    display_sample_purpose: 'petrology',
  };

  it('fills an empty sample from StraboSamples and records the link', () => {
    expect(getLinkedSample({id: 17802944671123}, strabosample)).toEqual({
      id: 17802944671123,
      strabosamples_id: 'ab12cd34-ef56-4a78-9b01-23456789abcd',
      sample_id_name: 'Basalt core BC-14',
      sample_description: 'Cored from the flow top',
      material_type: 'intact_rock',
      main_sampling_purpose: 'petrology',
    });
  });

  it('keeps what was entered in the field', () => {
    const linked = getLinkedSample({id: 1, sample_id_name: 'BC-14 field', material_type: 'sediment'}, strabosample);
    expect(linked.sample_id_name).toBe('BC-14 field');
    expect(linked.material_type).toBe('sediment');
    expect(linked.sample_description).toBe('Cored from the flow top');
  });

  it('prefers the Field record the sample was linked with before, but not its id', () => {
    const linked = getLinkedSample({id: 1}, {
      ...strabosample,
      field_data: {id: 999, strabosamples_id: 'other', sample_id_name: 'Old field name', color: 'black'},
    });
    expect(linked).toEqual({
      id: 1,
      strabosamples_id: 'ab12cd34-ef56-4a78-9b01-23456789abcd',
      sample_id_name: 'Old field name',
      color: 'black',
      sample_description: 'Cored from the flow top',
      material_type: 'intact_rock',
      main_sampling_purpose: 'petrology',
    });
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
});
