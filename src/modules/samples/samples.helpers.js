import {STRABOSAMPLES_FIELD_MAP} from './samples.constants';
import {isEmpty} from '../../shared/helpers';

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

// A Field sample linked to a StraboSamples sample. Only the fields the user left empty are filled in, so nothing typed
// in the field is overwritten. A sample linked to Field before carries that Field record as field_data, whose keys are
// preferred over the mapped StraboSamples fields wherever both have one. The sample keeps its own id, which is what
// the Spot and its parent know it by - the link lives only in strabosamples_id.
export const getLinkedSample = (fieldSample, strabosample) => {
  const {id: _id, strabosamples_id: _strabosamplesId, ...fieldData} = strabosample.field_data || {};
  const mappedValues = Object.fromEntries(
    Object.entries(STRABOSAMPLES_FIELD_MAP).map(([key, fieldKey]) => [fieldKey, strabosample[key]]),
  );
  const values = {...mappedValues, ...Object.fromEntries(Object.entries(fieldData).filter(([, v]) => !isEmpty(v)))};
  const valuesToFill = Object.fromEntries(
    Object.entries(values).filter(([key, value]) => !isEmpty(value) && isEmpty(fieldSample[key])),
  );
  return {...fieldSample, ...valuesToFill, strabosamples_id: getStraboSamplesId(strabosample)};
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
// whatever the server stored, so the ids are compared as strings.
const isFieldLinkTo = (link, spotId) => link.subsystem === 'field' && String(link.reference_id) === String(spotId);

// Whether the server has this StraboSamples sample linked to the sample in this Spot, which it only does once the Spot
// carrying the link has been uploaded
export const isLinkedToFieldSpot = (strabosample, spotId) => (strabosample.subsystem_links || []).some(
  link => isFieldLinkTo(link, spotId),
);

// Whether the server already has this StraboSamples sample linked to a sample in a different Spot
export const isLinkedToOtherFieldSpot = (strabosample, spotId) => (strabosample.subsystem_links || []).some(
  link => link.subsystem === 'field' && !isFieldLinkTo(link, spotId),
);
