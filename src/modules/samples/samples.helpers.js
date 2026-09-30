import {SAMPLE_LOCATION_KEY, SAMPLE_LOCATION_MAX_DECIMALS, STRABOSAMPLES_FIELD_MAP} from './samples.constants';
import {isEmpty, isEqual} from '../../shared/helpers';

// A sample is either a record kept on its parent Spot or a rich sample, which is a Spot of its own holding that
// record. Everything about the sample itself lives in the record either way.
export const getSampleMetadata = sample => sample.properties?.isSample
  ? sample.properties.samples?.[0] ?? {id: sample.properties.id}
  : sample;

// What a sample is called in a list: the label if it has one, and otherwise the name it was given. A label is
// filled in with that name on save, so the two read the same until someone types over it. A rich sample's Spot
// is named after its sample, which is what the name falls back to for one whose record has gone.
export const getSampleTitle = (sample) => {
  const metadata = getSampleMetadata(sample);
  return metadata.label || metadata.sample_id_name || sample.properties?.name || 'Unknown';
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

// The StraboSamples sample's location as [longitude, latitude], or undefined unless it has both
export const getStraboSampleLocation = (strabosample) => {
  const {latitude, longitude} = strabosample;
  if (isEmpty(latitude) || isEmpty(longitude) || !isFinite(latitude) || !isFinite(longitude)) return undefined;
  return [Number(longitude), Number(latitude)];
};

// Whether a coordinate matches StraboSamples' to as many decimal places as StraboSamples gives it, up to the most
// worth comparing, so a location entered with less precision still matches the one it was rounded from
const isSameCoordinate = (fieldCoordinate, strabosamplesCoordinate) => {
  const decimals = Math.min((String(strabosamplesCoordinate).split('.')[1] || '').length, SAMPLE_LOCATION_MAX_DECIMALS);
  return Number(fieldCoordinate).toFixed(decimals) === Number(strabosamplesCoordinate).toFixed(decimals);
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

// The placeholder a parent Spot keeps for a sample promoted to its own Spot: the id and nothing else. The server tells
// a stub from a sample by that shape, so any other key turns it into a second, blank copy of the sample.
export const isSampleStub = sample => Object.keys(sample).length === 1 && 'id' in sample;

// A Field sample unlinked from StraboSamples becomes a separate sample again under its own id
export const getUnlinkedSample = (fieldSample) => {
  const {strabosamples_id: _strabosamplesId, ...unlinkedSample} = fieldSample;
  return unlinkedSample;
};

// The other Field samples in the project already linked to this StraboSamples sample. Only one of them can own the
// link - the last one uploaded wins - so the user is warned before a second is linked.
export const getSamplesLinkedTo = (spots, strabosamplesId, fieldSampleId) => Object.values(spots).flatMap(
  spot => (spot.properties?.samples || []).filter(
    sample => sample.strabosamples_id === strabosamplesId && sample.id !== fieldSampleId,
  ),
);

// The sample in a /samplesdb/sample response. The sample's own fields may come wrapped in a `sample` object, with
// what the doc lists beside them (subsystem_links, field_data and the rest) either inside it or next to it, so both
// levels are read and the sample's own fields win where the two share a key.
export const getStraboSampleFromResponse = response => response?.sample ? {...response, ...response.sample}
  : response;

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
