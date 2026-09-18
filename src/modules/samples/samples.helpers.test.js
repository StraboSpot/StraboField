import {getSampleMetadata, getSampleTitle} from './samples.helpers';

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
