import {SAMPLE_LOCATION_KEY, SAMPLE_LOCATION_MAX_DECIMALS, STRABOSAMPLES_FIELD_MAP} from './samples.constants';
import {isEmpty, isEqual, isSameId} from '../../shared/helpers';
import {isSpotIdInDataset} from '../spots/spots.helpers';

// A Sample Spot moves only with its parent, or the two would be split across datasets. One already split off can
// only be put back, into a dataset holding its parent. Takes isSplitFromParent's answer rather than asking it, as a
// caller checking every dataset needs it only once.
export const canMoveSampleToDataset = (isSplit, parentSpot, dataset) =>
  isSplit && isSpotIdInDataset(dataset, parentSpot.properties.id);

// The samples kept as records on a Spot, rather than as {id} stubs for its Sample Spots. A Sample Spot has none: the
// one record it keeps is its own.
export const getLegacySamples = spot => (spot.properties?.isSample ? []
  : (spot.properties?.samples || []).filter(sample => !isSampleStub(sample)));

// A Field sample linked to a StraboSamples sample, taking the StraboSamples value for each of the keys picked and
// keeping its own everywhere else. The sample keeps its own id, which is what the Spot and its parent know it by -
// the link lives only in strabosamples_id.
export const getLinkedSample = (fieldSample, strabosample, keysToTake = []) => {
  const strabosampleValues = getStraboSampleValues(strabosample);
  const valuesToTake = Object.fromEntries(
    keysToTake.filter(key => key in strabosampleValues).map(key => [key, strabosampleValues[key]]),
  );
  return {...fieldSample, ...valuesToTake, strabosamples_id: getStraboSamplesId(strabosample)};
};

// A difference between the sample's location and StraboSamples', as [longitude, latitude] each. There is none when
// StraboSamples has no location, or when the sample's is a line or area a single point can't stand in for.
const getLocationDifference = (geometry, strabosample) => {
  const {latitude, longitude} = strabosample;
  const strabosamplesLocation = getStraboSampleLocation(strabosample);
  if (!strabosamplesLocation || (geometry && geometry.type !== 'Point')) return undefined;
  const fieldLocation = geometry?.coordinates;
  if (fieldLocation && isSameCoordinate(fieldLocation[0], longitude) && isSameCoordinate(fieldLocation[1], latitude)) {
    return undefined;
  }
  return {key: SAMPLE_LOCATION_KEY, fieldValue: fieldLocation, strabosamplesValue: strabosamplesLocation};
};

// The id of the StraboMicro project a linked sample's Micro data comes from, if it has any
export const getMicroProjectId = microData => microData?.project_strabo_id;

// Every rich sample nested under a Spot, at any depth, so a delete and its undo, or a move to another dataset, cover
// them all. A rich sample lists itself among its own samples, so the Spot started from is left out.
export const getRichSamples = (rootSpot, spots) => {
  const collected = {};
  const collect = (spot) => {
    spot.properties?.samples?.forEach((sample) => {
      const sampleSpot = spots[sample.id];
      if (sampleSpot && !isSameId(sample.id, rootSpot.properties.id) && !collected[sample.id]) {
        collected[sample.id] = sampleSpot;
        collect(sampleSpot);
      }
    });
  };
  collect(rootSpot);
  return Object.values(collected);
};

// The fields where StraboSamples has a value that differs from the Field sample's, for the user to pick between,
// then its location if that differs from the geometry the sample has or would be given. A field StraboSamples leaves
// empty is not a difference: the Field sample keeps what it has.
export const getSampleDifferences = (fieldSample, strabosample, geometry) => {
  const differences = Object.entries(getStraboSampleValues(strabosample))
    .filter(([key, value]) => !isEqual(value, fieldSample[key]))
    .map(([key, value]) => ({key: key, fieldValue: fieldSample[key], strabosamplesValue: value}));
  const locationDifference = getLocationDifference(geometry, strabosample);
  return locationDifference ? [...differences, locationDifference] : differences;
};

// A sample is either a record kept on its parent Spot or a rich sample, which is a Spot of its own holding that
// record. Everything about the sample itself lives in the record either way.
export const getSampleMetadata = sample => sample.properties?.isSample
  ? sample.properties.samples?.[0] ?? {id: sample.properties.id}
  : sample;

// The Spot a Sample Spot was taken from: the one whose samples list it. The Sample Spot itself is left out, as it lists
// itself in its own samples, so for a sample of a sample this is another Sample Spot.
export const getSampleParent = (sampleSpot, spots) => Object.values(spots).find(
  spot => !isSameId(spot.properties.id, sampleSpot.properties.id)
    && spot.properties.samples?.some(sample => isSameId(sample.id, sampleSpot.properties.id)));

// Tells the user which samples will be deleted along with a Spot, naming the first few, or null if there are none.
// Takes legacy samples and Sample Spots alike, as the Samples page lists both.
export const getSamplesDeletedWithSpotMessage = (samples, maxNamed = 3) => {
  if (isEmpty(samples)) return null;
  if (samples.length === 1) return `Its Sample ${getSampleTitle(samples[0])} will be deleted with it.`;
  const names = samples.slice(0, maxNamed).map(getSampleTitle).join(', ');
  const moreCount = samples.length - maxNamed;
  const namesText = moreCount > 0 ? `${names} and ${moreCount} more` : names;
  return `Its ${samples.length} Samples (${namesText}) will be deleted with it.`;
};

// The other Field samples in the project already linked to this StraboSamples sample. Only one of them can own the
// link - the last one uploaded wins - so the user is warned before a second is linked.
export const getSamplesLinkedTo = (spots, strabosamplesId, fieldSampleId) => Object.values(spots).flatMap(
  spot => (spot.properties?.samples || []).filter(
    sample => sample.strabosamples_id === strabosamplesId && sample.id !== fieldSampleId,
  ),
);

// The samples filed apart from their parents across a dataset's edge, which deleting the dataset has to deal with as
// deleting each of its Spots would. Only an old bug, which filed a new sample in the target dataset rather than its
// parent's, could split them up.
//   samplesToDelete - samples of the dataset's Spots that are filed elsewhere, at any depth. They go with their parent.
//   parentsToUnlink - Spots filed elsewhere whose samples are in the dataset, each with the ids of those samples, as
//                     its stubs for them have to come off. A parent being deleted anyway is left out.
// Ids are compared as strings throughout, as a dataset or a stub can hold one as a string. A dataset can hold
// thousands of Spots, so each lookup is built once rather than scanned for every Spot.
export const getSamplesSplitByDataset = (dataset, spots) => {
  const datasetSpotIds = new Set((dataset.spotIds || []).map(String));
  const datasetSpots = [...datasetSpotIds].map(spotId => spots[spotId]).filter(Boolean);
  const samplesToDelete = Object.values(Object.fromEntries(datasetSpots
    .flatMap(spot => getRichSamples(spot, spots))
    .filter(sampleSpot => !datasetSpotIds.has(String(sampleSpot.properties.id)))
    .map(sampleSpot => [sampleSpot.properties.id, sampleSpot])));
  const deletedSpotIds = new Set(
    [...datasetSpotIds, ...samplesToDelete.map(sampleSpot => String(sampleSpot.properties.id))]);
  // Each sample's parent: the Spot whose samples list it, leaving out the Sample Spot's stub for itself
  const parentsBySampleId = {};
  Object.values(spots).forEach(spot => spot.properties.samples?.forEach((sample) => {
    if (!isSameId(sample.id, spot.properties.id)) parentsBySampleId[sample.id] = spot;
  }));
  const parentsById = {};
  datasetSpots.filter(spot => spot.properties.isSample).forEach((sampleSpot) => {
    const parentSpot = parentsBySampleId[sampleSpot.properties.id];
    if (!parentSpot || deletedSpotIds.has(String(parentSpot.properties.id))) return;
    const parentId = parentSpot.properties.id;
    parentsById[parentId] = parentsById[parentId] || {parentSpot: parentSpot, sampleIds: []};
    parentsById[parentId].sampleIds.push(sampleSpot.properties.id);
  });
  return {parentsToUnlink: Object.values(parentsById), samplesToDelete: samplesToDelete};
};

// A parent's samples with those of the given ids taken off, as deleting them leaves it. Compared with isSameId, as a
// stub can hold its id as a string.
export const getSamplesWithout = (parentSpot, sampleIds) => (parentSpot.properties.samples || [])
  .filter(sample => !sampleIds.some(id => isSameId(id, sample.id)));

// What a sample is called in a list: the label if it has one, and otherwise the name it was given. A label is
// filled in with that name on save, so the two read the same until someone types over it. A rich sample's Spot
// is named after its sample, which is what the name falls back to for one whose record has gone.
export const getSampleTitle = (sample) => {
  const metadata = getSampleMetadata(sample);
  return metadata.label || metadata.sample_id_name || sample.properties?.name || 'Unknown';
};

// The ids to move when a Spot changes dataset: its own and its samples', at any depth. If any is in a read only
// dataset, none of them moves.
export const getSpotIdsToMove = (spot, spots) => [
  spot.properties.id,
  ...getRichSamples(spot, spots).map(sampleSpot => sampleSpot.properties.id),
];

// The sample in a /samplesdb/sample response. The sample's own fields may come wrapped in a `sample` object, with
// what the doc lists beside them (subsystem_links, field_data and the rest) either inside it or next to it, so both
// levels are read. The sample's own fields win where both have a value, so an empty one inside it can't hide one beside
// it.
export const getStraboSampleFromResponse = response => response?.sample ? {
  ...response,
  ...Object.fromEntries(Object.entries(response.sample).filter(([, value]) => !isEmpty(value))),
} : response;

// The StraboSamples sample's location as [longitude, latitude], or undefined unless it has both
export const getStraboSampleLocation = (strabosample) => {
  const {latitude, longitude} = strabosample;
  if (isEmpty(latitude) || isEmpty(longitude) || !isFinite(latitude) || !isFinite(longitude)) return undefined;
  return [Number(longitude), Number(latitude)];
};

// The id of the StraboSamples sample a Field sample is linked to. It is sent back to the server verbatim, and may be
// a number string or a UUID, so it is only ever handled as a string and never reformatted.
export const getStraboSamplesId = strabosample => typeof strabosample.id === 'string' ? strabosample.id
  : String(strabosample.id);

// The StraboSamples sample's values under the Field sample's keys, leaving out any it has no value for. A sample
// linked to Field before carries that Field record as field_data, whose keys are preferred over the mapped
// StraboSamples fields wherever both have one - except its id and link, which belong to the Field sample.
export const getStraboSampleValues = (strabosample) => {
  const {id: _id, strabosamples_id: _strabosamplesId, ...fieldData} = strabosample.field_data || {};
  const mappedValues = Object.fromEntries(
    Object.entries(STRABOSAMPLES_FIELD_MAP).flatMap(
      ([key, fieldKeys]) => [].concat(fieldKeys).map(fieldKey => [fieldKey, strabosample[key]])),
  );
  return Object.fromEntries(Object.entries({...mappedValues, ...fieldData}).filter(([, value]) => !isEmpty(value)));
};

// A Field sample unlinked from StraboSamples becomes a separate sample again under its own id
export const getUnlinkedSample = (fieldSample) => {
  const {strabosamples_id: _strabosamplesId, ...unlinkedSample} = fieldSample;
  return unlinkedSample;
};

// A Field link's reference_id is the id of the Spot holding the sample, not the sample's own id: a rich sample's own
// Spot, whose id is the sample's, or the parent Spot of a sample kept on it (which the link marks rich: false). It is
// whatever the server stored, so the ids are compared as strings. Either one id or a list of them is accepted.
const isFieldLinkTo = (link, spotIds) => link.subsystem === 'field'
  && [].concat(spotIds).some(spotId => String(link.reference_id) === String(spotId));

// Whether the server has this StraboSamples sample linked to the sample in this Spot, which it only does once the Spot
// carrying the link has been uploaded
export const isLinkedToFieldSpot = (strabosample, spotId) => (strabosample.subsystem_links || []).some(
  link => isFieldLinkTo(link, spotId),
);

// Whether the server already has this StraboSamples sample linked to a sample in a different Spot. A sample moving
// from its parent Spot to its own is known by both, so it can be given more than one.
export const isLinkedToOtherFieldSpot = (strabosample, spotIds) => (strabosample.subsystem_links || []).some(
  link => link.subsystem === 'field' && !isFieldLinkTo(link, spotIds),
);

// Whether a coordinate matches StraboSamples' to as many decimal places as StraboSamples gives it, up to the most
// worth comparing, so a location entered with less precision still matches the one it was rounded from
const isSameCoordinate = (fieldCoordinate, strabosamplesCoordinate) => {
  const decimals = Math.min((String(strabosamplesCoordinate).split('.')[1] || '').length, SAMPLE_LOCATION_MAX_DECIMALS);
  return Number(fieldCoordinate).toFixed(decimals) === Number(strabosamplesCoordinate).toFixed(decimals);
};

// The placeholder a parent Spot keeps for a sample promoted to its own Spot: the id and nothing else. The server tells
// a stub from a sample by that shape, so any other key turns it into a second, blank copy of the sample.
export const isSampleStub = sample => Object.keys(sample).length === 1 && 'id' in sample;

// Whether a Sample Spot sits in a dataset its parent isn't in
export const isSplitFromParent = (sampleSpot, parentSpot, datasets) => !!parentSpot && Object.values(datasets).some(
  dataset => isSpotIdInDataset(dataset, sampleSpot.properties.id)
    && !isSpotIdInDataset(dataset, parentSpot.properties.id));
