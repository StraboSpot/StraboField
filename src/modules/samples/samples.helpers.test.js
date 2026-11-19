import {
  canMoveSampleToDataset,
  getLegacySamples,
  getLinkedSample,
  getRichSamples,
  getSampleDifferences,
  getSampleMetadata,
  getSampleParent,
  getSamplesDeletedWithSpotMessage,
  getSamplesLinkedTo,
  getSamplesSplitByDataset,
  getSamplesWithout,
  getSampleTitle,
  getSpotIdsToMove,
  getStraboSampleFromResponse,
  getUnlinkedSample,
  isLinkedToFieldSpot,
  isLinkedToOtherFieldSpot,
  isSampleStub,
  isSplitFromParent,
} from './samples.helpers';
import {canMoveSpotIdsToDataset} from '../spots/spots.helpers';

const sample = {id: 's1', sample_id_name: 'JG-1'};
const richSample = {
  properties: {id: 1756000000001, isSample: true, name: 'JG-2', samples: [{id: 's2', sample_id_name: 'JG-2'}]},
};

// A Sample Spot and its parent, which lists it by an {id} stub. A Sample Spot lists itself in its own samples.
const parentId = 1756000000011;
const sampleId = 1756000000012;
const otherSampleId = 1756000000013;
const parent = {properties: {id: parentId, samples: [{id: sampleId}, {id: otherSampleId}]}, type: 'Feature'};
const sampleSpot = {properties: {id: sampleId, isSample: true, samples: [{id: sampleId}]}};
const otherSampleSpot = {properties: {id: otherSampleId, isSample: true, samples: [{id: otherSampleId}]}};
const familySpots = {[parentId]: parent, [sampleId]: sampleSpot, [otherSampleId]: otherSampleSpot};

// The same family with a sample of a sample, which its parent - the first sample - lists alongside itself
const nestedSampleId = 1756000000014;
const sampleWithNested = {
  properties: {id: sampleId, isSample: true, samples: [{id: sampleId}, {id: nestedSampleId}]},
};
const nestedSampleSpot = {properties: {id: nestedSampleId, isSample: true, samples: [{id: nestedSampleId}]}};
const nestedSpots = {...familySpots, [sampleId]: sampleWithNested, [nestedSampleId]: nestedSampleSpot};

describe('canMoveSampleToDataset', () => {
  const datasets = {
    12: {id: 12, spotIds: [parentId]},
    13: {id: 13, spotIds: [sampleId]},
    14: {id: 14, spotIds: []},
  };

  it('lets a sample split from its parent go back only to its parent\'s dataset', () => {
    const isSplit = isSplitFromParent(sampleSpot, parent, datasets);
    expect(canMoveSampleToDataset(isSplit, parent, datasets[12])).toBe(true);
    expect(canMoveSampleToDataset(isSplit, parent, datasets[13])).toBe(false);
    expect(canMoveSampleToDataset(isSplit, parent, datasets[14])).toBe(false);
  });

  it('lets a sample kept with its parent go nowhere on its own', () => {
    const together = {12: {id: 12, spotIds: [parentId, sampleId]}, 14: {id: 14, spotIds: []}};
    const isSplit = isSplitFromParent(sampleSpot, parent, together);
    expect(canMoveSampleToDataset(isSplit, parent, together[12])).toBe(false);
    expect(canMoveSampleToDataset(isSplit, parent, together[14])).toBe(false);
  });
});

describe('getLegacySamples', () => {
  it('finds the records kept whole on a Spot, leaving out the stubs for its Sample Spots', () => {
    const spot = {properties: {id: parentId, samples: [sample, {id: sampleId}]}};
    expect(getLegacySamples(spot)).toEqual([sample]);
  });

  it('leaves out a Sample Spot\'s record of itself', () => {
    expect(getLegacySamples(richSample)).toEqual([]);
    expect(getLegacySamples(sampleWithNested)).toEqual([]);
  });

  it('finds nothing on a Spot without samples', () => {
    expect(getLegacySamples({properties: {id: parentId}})).toEqual([]);
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

// Delete and the dataset move both go through this to take a Spot's rich samples along with it
describe('getRichSamples', () => {
  it('collects samples nested at any depth', () => {
    expect(getRichSamples(parent, nestedSpots)).toEqual([sampleWithNested, nestedSampleSpot, otherSampleSpot]);
  });

  it('leaves out the rich sample it starts from, which lists itself among its own samples', () => {
    expect(getRichSamples(sampleWithNested, nestedSpots)).toEqual([nestedSampleSpot]);
  });

  it('leaves out the rich sample it starts from when it lists itself by a string id', () => {
    const stringSelf = {properties: {id: sampleId, isSample: true, samples: [{id: sampleId.toString()}]}};
    expect(getRichSamples(stringSelf, {[sampleId]: stringSelf})).toEqual([]);
  });

  it('skips a sample stub with no Spot behind it', () => {
    expect(getRichSamples(parent, {[parentId]: parent})).toEqual([]);
  });

  it('returns nothing for a Spot without samples', () => {
    const spot = {properties: {id: parentId}, type: 'Feature'};
    expect(getRichSamples(spot, {[parentId]: spot})).toEqual([]);
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

describe('getSampleParent', () => {
  it('finds the Spot whose samples list it, rather than the Sample Spot itself', () => {
    expect(getSampleParent(sampleSpot, familySpots)).toBe(parent);
  });

  it('finds the parent of a sample listed by a string id', () => {
    const stringParent = {properties: {id: parentId, samples: [{id: sampleId.toString()}]}};
    expect(getSampleParent(sampleSpot, {[parentId]: stringParent, [sampleId]: sampleSpot})).toBe(stringParent);
  });

  it('finds nothing for a sample no Spot lists', () => {
    expect(getSampleParent(sampleSpot, {[sampleId]: sampleSpot})).toBeUndefined();
  });

  it('finds the Sample Spot a sample of a sample was taken from', () => {
    expect(getSampleParent(nestedSampleSpot, nestedSpots)).toBe(sampleWithNested);
  });
});

describe('getSamplesDeletedWithSpotMessage', () => {
  const sampleNamed = name => ({properties: {id: name, isSample: true, samples: [{id: name, sample_id_name: name}]}});

  it('says nothing for a Spot without samples', () => {
    expect(getSamplesDeletedWithSpotMessage([])).toBeNull();
  });

  // A legacy sample is named from its own record, a Sample Spot from the record it keeps of itself
  it('names legacy samples and Sample Spots alike', () => {
    expect(getSamplesDeletedWithSpotMessage([sample, sampleNamed('JG-2')]))
      .toBe('Its 2 Samples (JG-1, JG-2) will be deleted with it.');
  });

  it('names a single sample', () => {
    expect(getSamplesDeletedWithSpotMessage([sampleNamed('JG-1')])).toBe('Its Sample JG-1 will be deleted with it.');
  });

  it('counts and names a few samples', () => {
    expect(getSamplesDeletedWithSpotMessage(['JG-1', 'JG-2', 'JG-3'].map(sampleNamed)))
      .toBe('Its 3 Samples (JG-1, JG-2, JG-3) will be deleted with it.');
  });

  it('names only the first few of many', () => {
    expect(getSamplesDeletedWithSpotMessage(['JG-1', 'JG-2', 'JG-3', 'JG-4', 'JG-5'].map(sampleNamed)))
      .toBe('Its 5 Samples (JG-1, JG-2, JG-3 and 2 more) will be deleted with it.');
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

// Only an old bug could file a sample apart from its parent, which is what a dataset delete has to tidy up
describe('getSamplesSplitByDataset', () => {
  const nothingSplit = {parentsToUnlink: [], samplesToDelete: [], samplesToMove: []};
  // The parent in one dataset and both its samples in another
  const splitDatasets = {12: {id: 12, spotIds: [parentId]}, 13: {id: 13, spotIds: [sampleId, otherSampleId]}};

  it('finds nothing when every sample is filed with its parent', () => {
    const dataset = {id: 12, spotIds: [parentId, sampleId, otherSampleId]};
    expect(getSamplesSplitByDataset(dataset, familySpots, {12: dataset})).toEqual(nothingSplit);
  });

  it('deletes the samples, filed elsewhere, of a Spot in the dataset', () => {
    const datasets = {12: {id: 12, spotIds: [parentId, sampleId]}, 13: {id: 13, spotIds: [otherSampleId]}};
    expect(getSamplesSplitByDataset(datasets[12], familySpots, datasets))
      .toEqual({...nothingSplit, samplesToDelete: [otherSampleSpot]});
  });

  it('moves each sample in the dataset to the dataset of its parent filed elsewhere', () => {
    const dataset = {id: 13, spotIds: [sampleId, otherSampleId.toString()]};
    expect(getSamplesSplitByDataset(dataset, familySpots, {...splitDatasets, 13: dataset})).toEqual({
      ...nothingSplit,
      samplesToMove: [
        {parentSpot: parent, sampleSpot: sampleSpot, spotIds: [sampleId], toDatasetId: 12},
        {parentSpot: parent, sampleSpot: otherSampleSpot, spotIds: [otherSampleId], toDatasetId: 12},
      ],
    });
  });

  // With nowhere to move them, the samples go with the dataset and come off their parent
  it('unlinks a parent in no dataset from each of its samples in the dataset, once', () => {
    expect(getSamplesSplitByDataset(splitDatasets[13], familySpots, {13: splitDatasets[13]})).toEqual({
      ...nothingSplit,
      parentsToUnlink: [{parentSpot: parent, sampleIds: [sampleId, otherSampleId]}],
    });
  });

  // A sample of the moved sample goes with it when filed in the dataset too, and stays where it is when not
  it('moves a sample\'s own samples filed in the dataset along with it, and leaves those filed elsewhere', () => {
    const datasets = {...splitDatasets, 14: {id: 14, spotIds: [nestedSampleId]}};
    expect(getSamplesSplitByDataset({id: 13, spotIds: [sampleId]}, nestedSpots, datasets)).toEqual({
      ...nothingSplit,
      samplesToMove: [{parentSpot: parent, sampleSpot: sampleWithNested, spotIds: [sampleId], toDatasetId: 12}],
    });
    const dataset = {id: 13, spotIds: [sampleId, nestedSampleId]};
    expect(getSamplesSplitByDataset(dataset, nestedSpots, {...splitDatasets, 13: dataset}).samplesToMove).toEqual(
      [{parentSpot: parent, sampleSpot: sampleWithNested, spotIds: [sampleId, nestedSampleId], toDatasetId: 12}]);
  });

  // The nested sample's parent is filed elsewhere but deleted with the dataset's Spot it was taken at
  it('neither moves nor unlinks a sample whose parent is being deleted anyway', () => {
    const datasets = {12: {id: 12, spotIds: [parentId, nestedSampleId]}, 13: {id: 13, spotIds: [sampleId]}};
    expect(getSamplesSplitByDataset(datasets[12], nestedSpots, datasets))
      .toEqual({...nothingSplit, samplesToDelete: [sampleWithNested, otherSampleSpot]});
  });

  // Samples within samples shouldn't exist, so this is only a guard against corrupt data. The Sample in the dataset
  // isn't moved, as its parent is deleted, and its own sample filed elsewhere is reached through that parent.
  it('deletes the samples, filed elsewhere, of a sample deleted along with its parent', () => {
    const deepestId = 1756000000015;
    const nestedWithDeepest = {
      properties: {id: nestedSampleId, isSample: true, samples: [{id: nestedSampleId}, {id: deepestId}]},
    };
    const deepestSpot = {properties: {id: deepestId, isSample: true, samples: [{id: deepestId}]}};
    const spots = {...nestedSpots, [deepestId]: deepestSpot, [nestedSampleId]: nestedWithDeepest};
    const datasets = {
      12: {id: 12, spotIds: [parentId, nestedSampleId]},
      13: {id: 13, spotIds: [sampleId]},
      14: {id: 14, spotIds: [deepestId]},
    };
    expect(getSamplesSplitByDataset(datasets[12], spots, datasets))
      .toEqual({...nothingSplit, samplesToDelete: [sampleWithNested, deepestSpot, otherSampleSpot]});
  });

  it('skips a Spot the dataset lists that is missing from the device', () => {
    expect(getSamplesSplitByDataset({id: 12, spotIds: [1756000000099]}, familySpots, splitDatasets))
      .toEqual(nothingSplit);
  });
});

describe('getSamplesWithout', () => {
  it('takes off the samples of the given ids, matching a string id, and keeps the rest', () => {
    expect(getSamplesWithout(parent, [sampleId.toString()])).toEqual([{id: otherSampleId}]);
  });

  it('gives an empty list for a Spot without samples', () => {
    expect(getSamplesWithout({properties: {id: parentId}}, [sampleId])).toEqual([]);
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

describe('getSpotIdsToMove', () => {
  it('moves a Spot\'s samples along with it', () => {
    expect(getSpotIdsToMove(parent, familySpots)).toEqual([parentId, sampleId, otherSampleId]);
  });

  it('moves only the Spot when it has no samples', () => {
    const spot = {properties: {id: parentId}, type: 'Feature'};
    expect(getSpotIdsToMove(spot, {[parentId]: spot})).toEqual([parentId]);
  });

  // The parent, the split Sample and the Sample's own sample each in a dataset of their own, as only an old bug could
  // leave them. The Sample can only go back to its parent's dataset, and its sample goes with it unless that is held.
  it('takes a split Sample\'s own samples back to its parent\'s dataset with it', () => {
    const datasets = {
      12: {id: 12, spotIds: [parentId]},
      13: {id: 13, spotIds: [sampleId]},
      14: {id: 14, spotIds: [nestedSampleId]},
    };
    const isSplit = isSplitFromParent(sampleWithNested, parent, datasets);
    expect(canMoveSampleToDataset(isSplit, parent, datasets[12])).toBe(true);
    expect(canMoveSampleToDataset(isSplit, parent, datasets[14])).toBe(false);

    const spotIdsToMove = getSpotIdsToMove(sampleWithNested, nestedSpots);
    expect(spotIdsToMove).toEqual([sampleId, nestedSampleId]);
    expect(canMoveSpotIdsToDataset(spotIdsToMove, 12, datasets, [])).toBe(true);
    expect(canMoveSpotIdsToDataset(spotIdsToMove, 12, datasets, [14])).toBe(false);
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

describe('getUnlinkedSample', () => {
  it('drops the link and nothing else', () => {
    expect(getUnlinkedSample({id: 1, strabosamples_id: 'x', sample_id_name: 'A'})).toEqual({id: 1, sample_id_name: 'A'});
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

describe('isSampleStub', () => {
  it('knows the placeholder a parent Spot keeps from a sample', () => {
    expect(isSampleStub({id: 1})).toBe(true);
    expect(isSampleStub({id: 1, sample_id_name: 'A'})).toBe(false);
  });
});

describe('isSplitFromParent', () => {
  it('is split when the sample is in a dataset its parent isn\'t', () => {
    const datasets = {12: {id: 12, spotIds: [parentId]}, 13: {id: 13, spotIds: [sampleId]}};
    expect(isSplitFromParent(sampleSpot, parent, datasets)).toBe(true);
  });

  it('is not split when the two share a dataset, one held as a string', () => {
    const datasets = {12: {id: 12, spotIds: [parentId, sampleId.toString()]}, 13: {id: 13, spotIds: []}};
    expect(isSplitFromParent(sampleSpot, parent, datasets)).toBe(false);
  });

  it('is not split without a parent', () => {
    expect(isSplitFromParent(sampleSpot, undefined, {13: {id: 13, spotIds: [sampleId]}})).toBe(false);
  });
});
